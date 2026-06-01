// Dashboard State Management
let currentUser = null;
let currentPage = 1;
let currentLimit = 5; // Default limit for pagination
let productsList = [];

// Initialize Dashboard Page
document.addEventListener('DOMContentLoaded', () => {
  // 1. Auth Guard Checklist
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');

  if (!token || !userString) {
    console.warn('🔒 Guard Alert: No credentials found, redirecting to login...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
    return;
  }

  try {
    currentUser = JSON.parse(userString);
  } catch (error) {
    console.error('Failed to parse user profile session:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
    return;
  }

  // 2. Setup Nav Profile & Role Badges
  document.getElementById('nav-user-name').textContent = currentUser.name;
  document.getElementById('nav-user-email').textContent = currentUser.email;

  const roleBadge = document.getElementById('header-role-badge');
  roleBadge.textContent = currentUser.role;
  if (currentUser.role === 'admin') {
    roleBadge.className = 'badge badge-admin';
    // Reveal Admin Control Panel section if user is admin
    document.getElementById('admin-section').classList.remove('hidden');
    fetchAdminUsers();
  } else {
    roleBadge.className = 'badge badge-primary';
  }

  // 3. Register Event Listeners
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('refresh-btn').addEventListener('click', () => {
    currentPage = 1;
    fetchProducts();
  });
  
  // Search with simple debounce/delay
  let searchTimeout;
  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 1;
      fetchProducts();
    }, 400);
  });

  // Filter category dropdown
  document.getElementById('category-filter').addEventListener('change', () => {
    currentPage = 1;
    fetchProducts();
  });

  // Pagination buttons
  document.getElementById('prev-page-btn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchProducts();
    }
  });

  document.getElementById('next-page-btn').addEventListener('click', () => {
    currentPage++;
    fetchProducts();
  });

  // Modal open button
  document.getElementById('open-create-modal-btn').addEventListener('click', () => {
    openModal('create-modal');
  });

  // Form submits
  document.getElementById('create-product-form').addEventListener('submit', handleCreateProduct);
  document.getElementById('edit-product-form').addEventListener('submit', handleEditProduct);

  // 4. Initial Fetch
  fetchProducts();
});

// Logout implementation
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showToast('Session logged out successfully. Goodbye!', 'success');
  setTimeout(() => {
    window.location.href = '/index.html';
  }, 1000);
}

// Global modal triggers
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  // Reset forms on close
  if (modalId === 'create-modal') {
    document.getElementById('create-product-form').reset();
  }
}

// Get all products based on active filters and page query
async function fetchProducts() {
  const search = document.getElementById('search-input').value.trim();
  const category = document.getElementById('category-filter').value;
  
  let endpoint = `/products?page=${currentPage}&limit=${currentLimit}`;
  if (search) endpoint += `&search=${encodeURIComponent(search)}`;
  if (category) endpoint += `&category=${encodeURIComponent(category)}`;

  const tableBody = document.getElementById('products-table-body');
  tableBody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center" style="padding: 40px; color: var(--text-secondary);">
        Updating product catalog... ⏳
      </td>
    </tr>
  `;

  const response = await apiRequest(endpoint, { method: 'GET' });

  if (response.success) {
    productsList = response.products;
    renderProductsTable(response.products);
    updateStats(response.pagination.total);
    renderPagination(response.pagination);
  } else {
    showToast(response.message, 'error');
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center" style="padding: 40px; color: var(--error);">
          ⚠️ Failed to fetch inventory records: ${response.message}
        </td>
      </tr>
    `;
  }
}

// Populate stats grid dynamically
function updateStats(totalProductsCount) {
  document.getElementById('stat-total-products').textContent = totalProductsCount;
  
  // Calculate category presence and out-of-stock items in this page range
  // (In real production we would query dedicated aggregate endpoints, but this local calculation is perfect for intern assignments!)
  const categoriesInDb = new Set();
  let lowStockCount = 0;

  productsList.forEach(p => {
    categoriesInDb.add(p.category);
    if (p.stock <= 5) {
      lowStockCount++;
    }
  });

  document.getElementById('stat-active-categories').textContent = `${categoriesInDb.size} / 4`;
  document.getElementById('stat-out-of-stock').textContent = lowStockCount;
  document.getElementById('total-count-badge').textContent = `${totalProductsCount} Items`;
}

// Generate the Product Catalog Table
function renderProductsTable(products) {
  const tableBody = document.getElementById('products-table-body');
  tableBody.innerHTML = '';

  if (products.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <h3>No Products Found</h3>
            <p>Try refining your search terms, filtering by another category, or add a brand new product entry.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  products.forEach(product => {
    const row = document.createElement('tr');
    
    // Check if the current user owns this product OR if they're an admin (Authorized for Edit/Delete)
    const isCreator = product.createdBy && (product.createdBy._id === currentUser.id || product.createdBy === currentUser.id);
    const isAdmin = currentUser.role === 'admin';
    const isAuthorized = isCreator || isAdmin;

    // Capitalize category
    const formattedCategory = product.category.charAt(0).toUpperCase() + product.category.slice(1);
    
    // Format creator name
    const creatorName = product.createdBy ? product.createdBy.name : 'Unknown';

    // Renders the row
    row.innerHTML = `
      <td class="product-row-name">${escapeHtml(product.name)}<br>
        <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">
          ${escapeHtml(product.description || 'No description provided')}
        </span>
      </td>
      <td><span class="badge badge-primary">${formattedCategory}</span></td>
      <td class="product-row-price">$${Number(product.price).toFixed(2)}</td>
      <td>
        <span style="color: ${product.stock <= 5 ? 'var(--error)' : 'var(--text-primary)'}; font-weight: 500;">
          ${product.stock} units
        </span>
      </td>
      <td>
        <span style="font-size: 13px;">${escapeHtml(creatorName)}</span>
      </td>
      <td>
        <div class="product-actions-cell">
          ${isAuthorized ? `
            <button class="btn btn-secondary" onclick="openEditModal('${product._id}')">Edit ✏️</button>
            <button class="btn btn-danger" onclick="handleDeleteProduct('${product._id}')">Delete 🗑️</button>
          ` : `
            <span style="font-size: 11px; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px; padding: 8px 12px; background: rgba(255,255,255,0.02); border-radius: 6px;">
              🔒 Locked (RBAC)
            </span>
          `}
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Generate pagination controls values
function renderPagination(pagination) {
  const { total, page, limit, pages } = pagination;
  
  const infoText = `Showing Page ${page} of ${pages || 1} (${total} total products)`;
  document.getElementById('pagination-info').textContent = infoText;

  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');

  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page >= pages || pages === 0;
}

// Handle Add Product Submit
async function handleCreateProduct(e) {
  e.preventDefault();

  const name = document.getElementById('create-name').value.trim();
  const description = document.getElementById('create-description').value.trim();
  const price = parseFloat(document.getElementById('create-price').value);
  const stock = parseInt(document.getElementById('create-stock').value);
  const category = document.getElementById('create-category').value;

  if (!name || isNaN(price) || isNaN(stock) || !category) {
    showToast('Please complete all required product specifications.', 'error');
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving... ⏳';

  const response = await apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify({ name, description, price, stock, category }),
  });

  submitBtn.disabled = false;
  submitBtn.textContent = 'Create Item';

  if (response.success) {
    showToast('Product entry recorded successfully!', 'success');
    closeModal('create-modal');
    fetchProducts(); // Refresh catalog
  } else {
    showToast(response.message, 'error');
  }
}

// Load current fields into Edit Modal and Open it
async function openEditModal(productId) {
  const response = await apiRequest(`/products/${productId}`, { method: 'GET' });

  if (response.success) {
    const product = response.product;
    document.getElementById('edit-id').value = product._id;
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-description').value = product.description || '';
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-stock').value = product.stock;
    document.getElementById('edit-category').value = product.category;

    openModal('edit-modal');
  } else {
    showToast(`Failed to retrieve product details: ${response.message}`, 'error');
  }
}

// Handle Edit Form Submit
async function handleEditProduct(e) {
  e.preventDefault();

  const id = document.getElementById('edit-id').value;
  const name = document.getElementById('edit-name').value.trim();
  const description = document.getElementById('edit-description').value.trim();
  const price = parseFloat(document.getElementById('edit-price').value);
  const stock = parseInt(document.getElementById('edit-stock').value);
  const category = document.getElementById('edit-category').value;

  if (!id || !name || isNaN(price) || isNaN(stock) || !category) {
    showToast('Please fill out all required fields.', 'error');
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving... ⏳';

  const response = await apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, description, price, stock, category }),
  });

  submitBtn.disabled = false;
  submitBtn.textContent = 'Save Changes';

  if (response.success) {
    showToast('Product specifications updated successfully!', 'success');
    closeModal('edit-modal');
    fetchProducts(); // Refresh catalog
  } else {
    showToast(response.message, 'error');
  }
}

// Delete product catalog entry
async function handleDeleteProduct(productId) {
  if (confirm('Are you absolutely sure you want to delete this product entry from inventory? This action is irreversible.')) {
    const response = await apiRequest(`/products/${productId}`, { method: 'DELETE' });

    if (response.success) {
      showToast('Product catalog entry deleted.', 'success');
      fetchProducts(); // Refresh
    } else {
      showToast(response.message, 'error');
    }
  }
}

// ADMIN ONLY - Fetch and Render all registered Users
async function fetchAdminUsers() {
  const usersTableBody = document.getElementById('admin-users-table-body');
  
  const response = await apiRequest('/auth/users', { method: 'GET' });

  if (response.success) {
    usersTableBody.innerHTML = '';
    
    if (response.users.length === 0) {
      usersTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No users registered in system.</td></tr>';
      return;
    }

    response.users.forEach(user => {
      const row = document.createElement('tr');
      const formattedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      row.innerHTML = `
        <td style="font-family: monospace; font-size: 12px; color: var(--text-muted);">${user._id}</td>
        <td style="font-weight: 500;">${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>
          <span class="badge ${user.role === 'admin' ? 'badge-admin' : 'badge-primary'}">
            ${user.role}
          </span>
        </td>
        <td style="font-size: 13px; color: var(--text-secondary);">${formattedDate}</td>
      `;
      usersTableBody.appendChild(row);
    });
  } else {
    usersTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center" style="color: var(--error);">
          Failed to fetch users database: ${response.message}
        </td>
      </tr>
    `;
  }
}

// Helper to escape HTML tags to prevent XSS in template injections
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
