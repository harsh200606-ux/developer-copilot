
const BASE_URL = 'http://127.0.0.1:8000';

class ApiClient {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  // --------------------------------------------------
  // TOKEN MANAGEMENT
  // --------------------------------------------------

  getToken() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // --------------------------------------------------
  // GENERIC REQUEST
  // --------------------------------------------------

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);

      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register' &&
        window.location.pathname !== '/'
      ) {
        window.location.href = '/login';
      }
    }

    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        data?.detail ||
        data?.message ||
        `Request failed with status ${response.status}`;

      throw new Error(
        typeof errorMsg === 'string'
          ? errorMsg
          : JSON.stringify(errorMsg)
      );
    }

    return data;
  }

  // --------------------------------------------------
  // MULTIPART REQUESTS
  // Used for file uploads. Do not set Content-Type
  // manually; the browser adds the multipart boundary.
  // --------------------------------------------------

  async multipartRequest(endpoint, formData, method = 'POST') {
    const headers = {};
    const token = this.getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: formData,
    });

    if (response.status === 401) {
      this.setToken(null);

      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register' &&
        window.location.pathname !== '/'
      ) {
        window.location.href = '/login';
      }
    }

    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        data?.detail ||
        data?.message ||
        `Request failed with status ${response.status}`;

      throw new Error(
        typeof errorMsg === 'string'
          ? errorMsg
          : JSON.stringify(errorMsg)
      );
    }

    return data;
  }

  // --------------------------------------------------
  // AUTH ENDPOINTS
  // --------------------------------------------------

  login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  register(username, email, password) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  getCurrentUser() {
    return this.request('/api/auth/me');
  }

  // --------------------------------------------------
  // PROJECT ENDPOINTS
  // --------------------------------------------------

  getProjects() {
    return this.request('/api/projects/');
  }

  getProject(id) {
    return this.request(`/api/projects/${id}`);
  }

  analyzeProject(id) {
    return this.request(`/api/projects/${id}/analyze`, {
      method: 'POST',
    });
  }

  // --------------------------------------------------
  // PROJECT TESTS & COVERAGE
  // Runs tests in the isolated Docker test runner.
  // --------------------------------------------------

  runProjectTests(id) {
    return this.request(`/api/projects/${id}/tests/run`, {
      method: 'POST',
    });
  }

// --------------------------------------------------
// PROJECT SECURITY SCAN
// Runs Bandit against the uploaded Python project.
// --------------------------------------------------

scanProjectSecurity(id) {
  return this.request(`/api/projects/${id}/security-scan`, {
    method: 'POST',
  });
}

  createProject(data) {
    return this.request('/api/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateProject(id, data) {
    return this.request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteProject(id) {
    return this.request(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }
 
  // --------------------------------------------------
  // PROJECT ZIP UPLOAD
  // Imports a ZIP and extracts it into the project.
  // --------------------------------------------------

  async uploadProjectZip(projectId, file) {
    const formData = new FormData();

    formData.append('file', file, file.name);

    return this.multipartRequest(
      `/api/projects/${projectId}/upload`,
      formData
    );
  }

  // --------------------------------------------------
  // EXISTING PROJECT FILE UPLOAD
  // This endpoint uploads a file into the project.
  // It does NOT mean temporary analysis.
  // --------------------------------------------------

  async uploadProjectFile(projectId, file, relativePath = file.name) {
    const normalizedPath = relativePath.replace(/\\/g, '/');
    const formData = new FormData();

    formData.append('file', file, file.name);
    formData.append('relative_path', normalizedPath);

    return this.multipartRequest(
      `/api/projects/${projectId}/files`,
      formData
    );
  }

  // --------------------------------------------------
  // TEMPORARY FILE ANALYSIS
  // Intended to analyze a selected file without
  // adding it to or changing the project.
  // Requires a matching backend endpoint.
  // --------------------------------------------------

  async analyzeTemporaryFile(projectId, file) {
    const formData = new FormData();

    formData.append('file', file, file.name);

    return this.multipartRequest(
      `/api/projects/${projectId}/files/analyze`,
      formData
    );
  }

  // --------------------------------------------------
  // LIST EXISTING PYTHON FILES
  // Used to choose which project file to replace.
  // Requires a matching backend endpoint.
  // --------------------------------------------------

  listProjectPythonFiles(projectId) {
    return this.request(
      `/api/projects/${projectId}/files/list`
    );
  }

  // --------------------------------------------------
  // REPLACE AN EXISTING PROJECT FILE
  // Call this only after the user confirms.
  // Requires a matching backend endpoint.
  // --------------------------------------------------

  async replaceProjectFile(projectId, file, relativePath) {
    const normalizedPath = relativePath.replace(/\\/g, '/');
    const formData = new FormData();

    formData.append('file', file, file.name);
    formData.append('relative_path', normalizedPath);

    return this.multipartRequest(
      `/api/projects/${projectId}/files/replace`,
      formData
    );
  }

  // --------------------------------------------------
  // APPLICATION RUNNER ENDPOINTS
  // --------------------------------------------------

  startProject(id) {
    return this.request(`/api/projects/${id}/start`, {
      method: 'POST',
    });
  }

  stopProject(id) {
    return this.request(`/api/projects/${id}/stop`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
