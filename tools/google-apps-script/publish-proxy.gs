const DEFAULT_OWNER = 'Evyatar-Hazan';
const DEFAULT_REPO = 'nis-boutique-catering';
const DEFAULT_WORKFLOW_FILE = 'cloudflare-pages.yml';

const jsonResponse = (payload, statusCode) => {
  const output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
};

const getRequiredProperty = (properties, key) => {
  const value = properties.getProperty(key);
  if (!value) {
    throw new Error(`Missing Apps Script property: ${key}`);
  }
  return value;
};

const getBearerToken = (event) => {
  let body = {};
  try {
    body = event?.postData?.contents ? JSON.parse(event.postData.contents) : {};
  } catch (error) {
    body = {};
  }
  if (body.accessToken) {
    return String(body.accessToken);
  }

  const authorization = event?.parameter?.authorization || '';
  const match = String(authorization).match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
};

const readGoogleUser = (accessToken) => {
  const response = UrlFetchApp.fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('Could not verify Google user');
  }

  return JSON.parse(response.getContentText());
};

const dispatchGithubWorkflow = (properties, sourceEmail) => {
  const owner = properties.getProperty('GITHUB_OWNER') || DEFAULT_OWNER;
  const repo = properties.getProperty('GITHUB_REPO') || DEFAULT_REPO;
  const workflowFile = properties.getProperty('GITHUB_WORKFLOW_FILE') || DEFAULT_WORKFLOW_FILE;
  const githubToken = getRequiredProperty(properties, 'GITHUB_TOKEN');
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    payload: JSON.stringify({
      ref: 'main',
      inputs: {
        source: `content-studio:${sourceEmail}`,
      },
    }),
    muteHttpExceptions: true,
  });

  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error(`GitHub workflow_dispatch failed: ${status} ${response.getContentText()}`);
  }

  return status;
};

function doPost(event) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const allowedEditors = getRequiredProperty(properties, 'ALLOWED_EDITORS')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    const accessToken = getBearerToken(event);

    if (!accessToken) {
      return jsonResponse({ ok: false, error: 'missing_google_access_token' }, 401);
    }

    const user = readGoogleUser(accessToken);
    const email = String(user.email || '').toLowerCase();

    if (!allowedEditors.includes(email)) {
      return jsonResponse({ ok: false, error: 'forbidden', email }, 403);
    }

    const githubStatus = dispatchGithubWorkflow(properties, email);
    return jsonResponse({ ok: true, githubStatus, email }, 200);
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) }, 500);
  }
}

function doGet() {
  return jsonResponse({ ok: true, service: 'nis-content-studio-publish-proxy' }, 200);
}
