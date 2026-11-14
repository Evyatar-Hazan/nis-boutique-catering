import { products } from '../data/products.js';
import { OrderingSite } from './components/OrderingSite';
import { AccessibilityStatementPage } from './features/accessibility/AccessibilityStatementPage';
import { isAccessibilityStatementPath } from './features/accessibility/isAccessibilityStatementPath';
import './App.css';

const approvedProducts = products.filter((product) => product.status === 'approved');

function App() {
  return isAccessibilityStatementPath(window.location.pathname)
    ? <AccessibilityStatementPage />
    : <OrderingSite catalog={approvedProducts} />;
}

export default App;
