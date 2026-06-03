const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// הגשת קבצים סטטיים (תמונות אווטאר)
app.use('/public', express.static(path.join(__dirname, 'public')));

// נתיבי קבצים
const USER_TESTS_FILE = path.join(__dirname, 'data', 'userTests.json');
const TESTS_FILE = path.join(__dirname, 'data', 'tests.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const POSTS_FILE = path.join(__dirname, 'data', 'posts.json');
const COMMENTS_FILE = path.join(__dirname, 'data', 'comments.json');
const TEST_COMMENTS_FILE = path.join(__dirname, 'data', 'testComments.json');

// פונקציה עוזרת לקריאת קובץ JSON
const readJsonFile = (filePath, defaultData = []) => {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return defaultData;
  }
};

// קריאת מבחני משתמש
app.get('/api/user-tests', (req, res) => {
  try {
    if (!fs.existsSync(USER_TESTS_FILE)) {
      fs.writeFileSync(USER_TESTS_FILE, '[]');
    }

    const data = fs.readFileSync(USER_TESTS_FILE, 'utf8');
    const tests = JSON.parse(data);
    res.json(tests);
  } catch (error) {
    console.error('Error reading user tests:', error);
    res.status(500).json({ error: 'Failed to read user tests' });
  }
});

// שמירת מבחן חדש
app.post('/api/user-tests', (req, res) => {
  try {
    const newTest = req.body;

    // קריאת המבחנים הקיימים
    let tests = [];
    if (fs.existsSync(USER_TESTS_FILE)) {
      const data = fs.readFileSync(USER_TESTS_FILE, 'utf8');
      tests = JSON.parse(data);
    }

    // הוספת id ייחודי למבחן החדש
    const testWithId = {
      ...newTest,
      id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    // הוספת המבחן לתחילת הרשימה
    tests.unshift(testWithId);

    // שמירה לקובץ
    fs.writeFileSync(USER_TESTS_FILE, JSON.stringify(tests, null, 2));

    console.log('Test saved successfully:', testWithId.id);
    res.json(testWithId);
  } catch (error) {
    console.error('Error saving test:', error);
    res.status(500).json({ error: 'Failed to save test' });
  }
});

// מחיקת מבחן
app.delete('/api/user-tests/:id', (req, res) => {
  try {
    const testId = req.params.id;

    if (!fs.existsSync(USER_TESTS_FILE)) {
      return res.status(404).json({ error: 'No tests found' });
    }

    const data = fs.readFileSync(USER_TESTS_FILE, 'utf8');
    const tests = JSON.parse(data);

    // מחיקת המבחן לפי ID
    const filteredTests = tests.filter(test => test.id !== testId);

    if (filteredTests.length === tests.length) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // שמירה לקובץ
    fs.writeFileSync(USER_TESTS_FILE, JSON.stringify(filteredTests, null, 2));

    console.log('Test deleted successfully:', testId);
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({ error: 'Failed to delete test' });
  }
});

// === USERS ENDPOINTS ===
// קריאת כל המשתמשים
app.get('/api/users', (req, res) => {
  try {
    const users = readJsonFile(USERS_FILE, []);
    res.json(users);
  } catch (error) {
    console.error('Error reading users:', error);
    res.status(500).json({ error: 'Failed to read users' });
  }
});

// === TESTS ENDPOINTS ===
// קריאת כל המבחנים (סטטיים + משתמש)
app.get('/api/tests', (req, res) => {
  try {
    const staticTests = readJsonFile(TESTS_FILE, []);
    const userTests = readJsonFile(USER_TESTS_FILE, []);
    const allTests = [...userTests, ...staticTests];
    res.json(allTests);
  } catch (error) {
    console.error('Error reading tests:', error);
    res.status(500).json({ error: 'Failed to read tests' });
  }
});

// === POSTS ENDPOINTS ===
// קריאת כל הפוסטים
app.get('/api/posts', (req, res) => {
  try {
    const posts = readJsonFile(POSTS_FILE, []);
    res.json(posts);
  } catch (error) {
    console.error('Error reading posts:', error);
    res.status(500).json({ error: 'Failed to read posts' });
  }
});

// === COMMENTS ENDPOINTS ===
// קריאת כל התגובות
app.get('/api/comments', (req, res) => {
  try {
    const comments = readJsonFile(COMMENTS_FILE, []);
    res.json(comments);
  } catch (error) {
    console.error('Error reading comments:', error);
    res.status(500).json({ error: 'Failed to read comments' });
  }
});

// === TEST COMMENTS ENDPOINTS ===
// קריאת תגובות לפי מבחן
app.get('/api/tests/:testId/comments', (req, res) => {
  try {
    const { testId } = req.params;
    const comments = readJsonFile(TEST_COMMENTS_FILE, []);
    const testComments = comments.filter(comment => comment.testId === testId);
    res.json(testComments);
  } catch (error) {
    console.error('Error reading test comments:', error);
    res.status(500).json({ error: 'Failed to read test comments' });
  }
});

// הוספת תגובה חדשה למבחן
app.post('/api/tests/:testId/comments', (req, res) => {
  try {
    const { testId } = req.params;
    const { authorId, body, parentId = null } = req.body;

    if (!authorId || !body) {
      return res.status(400).json({ error: 'Author ID and body are required' });
    }

    const comments = readJsonFile(TEST_COMMENTS_FILE, []);
    const newComment = {
      id: `tc${Date.now()}`,
      testId,
      authorId,
      body,
      createdAt: new Date().toISOString(),
      likes: [],
      parentId,
      replies: [],
    };

    if (parentId) {
      // אם זו תגובה מקוננת, נמצא את התגובה האב ונוסיף אליה
      const addReplyToComment = commentsList => {
        for (const comment of commentsList) {
          if (comment.id === parentId) {
            comment.replies.push(newComment);
            return true;
          }
          if (comment.replies && addReplyToComment(comment.replies)) {
            return true;
          }
        }
        return false;
      };

      if (!addReplyToComment(comments)) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
    } else {
      // תגובה ראשית
      comments.push(newComment);
    }

    fs.writeFileSync(TEST_COMMENTS_FILE, JSON.stringify(comments, null, 2));
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding test comment:', error);
    res.status(500).json({ error: 'Failed to add test comment' });
  }
});

// עדכון תגובה
app.put('/api/tests/:testId/comments/:commentId', (req, res) => {
  try {
    const { commentId } = req.params;
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'Body is required' });
    }

    const comments = readJsonFile(TEST_COMMENTS_FILE, []);

    const updateComment = commentsList => {
      for (const comment of commentsList) {
        if (comment.id === commentId) {
          comment.body = body;
          comment.updatedAt = new Date().toISOString();
          return true;
        }
        if (comment.replies && updateComment(comment.replies)) {
          return true;
        }
      }
      return false;
    };

    if (!updateComment(comments)) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    fs.writeFileSync(TEST_COMMENTS_FILE, JSON.stringify(comments, null, 2));
    res.json({ message: 'Comment updated successfully' });
  } catch (error) {
    console.error('Error updating test comment:', error);
    res.status(500).json({ error: 'Failed to update test comment' });
  }
});

// מחיקת תגובה
app.delete('/api/tests/:testId/comments/:commentId', (req, res) => {
  try {
    const { commentId } = req.params;
    const comments = readJsonFile(TEST_COMMENTS_FILE, []);

    const deleteComment = commentsList => {
      for (let i = 0; i < commentsList.length; i++) {
        if (commentsList[i].id === commentId) {
          commentsList.splice(i, 1);
          return true;
        }
        if (commentsList[i].replies && deleteComment(commentsList[i].replies)) {
          return true;
        }
      }
      return false;
    };

    if (!deleteComment(comments)) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    fs.writeFileSync(TEST_COMMENTS_FILE, JSON.stringify(comments, null, 2));
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting test comment:', error);
    res.status(500).json({ error: 'Failed to delete test comment' });
  }
});

// === LIKES ENDPOINTS ===
// הוספת/הסרת לייק לתגובה
app.post('/api/tests/:testId/comments/:commentId/like', (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const comments = readJsonFile(TEST_COMMENTS_FILE, []);

    const toggleLike = commentsList => {
      for (const comment of commentsList) {
        if (comment.id === commentId) {
          const likeIndex = comment.likes.indexOf(userId);
          if (likeIndex > -1) {
            // הסר לייק
            comment.likes.splice(likeIndex, 1);
          } else {
            // הוסף לייק
            comment.likes.push(userId);
          }
          return true;
        }
        if (comment.replies && toggleLike(comment.replies)) {
          return true;
        }
      }
      return false;
    };

    if (!toggleLike(comments)) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    fs.writeFileSync(TEST_COMMENTS_FILE, JSON.stringify(comments, null, 2));
    res.json({ message: 'Like toggled successfully' });
  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({ error: 'Failed to toggle comment like' });
  }
});

// הוספת/הסרת לייק למבחן
app.post('/api/tests/:testId/like', (req, res) => {
  try {
    const { testId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // נבדוק קודם במבחני משתמש
    let tests = readJsonFile(USER_TESTS_FILE, []);
    let testFound = false;

    for (const test of tests) {
      if (test.id === testId) {
        if (!test.likes) test.likes = [];
        const likeIndex = test.likes.indexOf(userId);
        if (likeIndex > -1) {
          test.likes.splice(likeIndex, 1);
        } else {
          test.likes.push(userId);
        }
        testFound = true;
        break;
      }
    }

    if (testFound) {
      fs.writeFileSync(USER_TESTS_FILE, JSON.stringify(tests, null, 2));
      return res.json({ message: 'Like toggled successfully' });
    }

    // אם לא נמצא, נבדוק במבחנים הסטטיים
    tests = readJsonFile(TESTS_FILE, []);
    for (const test of tests) {
      if (test.id === testId) {
        if (!test.likes) test.likes = [];
        const likeIndex = test.likes.indexOf(userId);
        if (likeIndex > -1) {
          test.likes.splice(likeIndex, 1);
        } else {
          test.likes.push(userId);
        }
        testFound = true;
        break;
      }
    }

    if (!testFound) {
      return res.status(404).json({ error: 'Test not found' });
    }

    fs.writeFileSync(TESTS_FILE, JSON.stringify(tests, null, 2));
    res.json({ message: 'Like toggled successfully' });
  } catch (error) {
    console.error('Error toggling test like:', error);
    res.status(500).json({ error: 'Failed to toggle test like' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 User tests file: ${USER_TESTS_FILE}`);
});
// Test comment for git hook
