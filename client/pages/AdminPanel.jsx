import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';

const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTodos, setUserTodos] = useState([]);
  const [todosLoading, setTodosLoading] = useState(false);
  const [showUserTodos, setShowUserTodos] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchStatistics();
  }, [page, currentSearchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (currentSearchTerm) {
        params.append('search', currentSearchTerm);
      }

      if (roleFilter) {
        params.append('role', roleFilter);
      }

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.pages);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/admin/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setStatistics(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const handleSearch = () => {
    setCurrentSearchTerm(searchTerm);
    setPage(1); // Сброс на первую страницу при поиске
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentSearchTerm('');
    setPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const fetchUserTodos = async (userId) => {
    try {
      setTodosLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/todos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUserTodos(data.data.todos);
        setSelectedUser(userId);
        setShowUserTodos(true);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch user todos');
    } finally {
      setTodosLoading(false);
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ isActive })
      });

      const data = await response.json();

      if (data.success) {
        fetchUsers();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();

      if (data.success) {
        setError(null);
        fetchUsers();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to update user role');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#6c757d';
      case 'moderator': return '#6c757d';
      case 'user': return '#6c757d';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px'
      }}>
        Loading admin panel...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3>Error</h3>
        <p>{error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchUsers();
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1> Admin Panel</h1>
      <p>Welcome, {user?.username}!</p>

      {/* Statistics */}
      {statistics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3>{statistics.users.totalUsers || 0}</h3>
            <p>Total Users</p>
          </div>

          <div style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3>{statistics.users.verifiedUsers || 0}</h3>
            <p>Verified Users</p>
          </div>

          <div style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3>{statistics.users.adminUsers || 0}</h3>
            <p>Admin Users</p>
          </div>

          <div style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3>{statistics.todos.totalTodos || 0}</h3>
            <p>Total Todos</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        display: 'flex',
        gap: '15px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px',
            flex: 1
          }}
        />

        <button
          onClick={handleSearch}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
           Search
        </button>

        {currentSearchTerm && (
          <button
            onClick={handleClearSearch}
            style={{
              padding: '10px 15px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✕ Clear
          </button>
        )}

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Users List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          backgroundColor: '#f8f9fa'
        }}>
          <h3>Users Management</h3>
        </div>

        {users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            <h3>No users found</h3>
            <p>No users match your search criteria.</p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              style={{
                padding: '20px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0' }}>
                      {user.profile?.firstName} {user.profile?.lastName}
                    </h4>
                    <p style={{ margin: '0', color: '#6c757d' }}>
                      {user.email} • @{user.username}
                    </p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <span
                        style={{
                          backgroundColor: getRoleColor(user.role),
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          textTransform: 'uppercase'
                        }}
                      >
                        {user.role}
                      </span>

                      <span
                        style={{
                          backgroundColor: user.isEmailVerified ? '#28a745' : '#dc3545',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                      >
                        {user.isEmailVerified ? 'Verified' : 'Unverified'}
                      </span>

                      <span
                        style={{
                          backgroundColor: user.isActive ? '#28a745' : '#dc3545',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '10px' }}>
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  value={user.role}
                  onChange={(e) => updateUserRole(user._id, e.target.value)}
                  disabled={user._id === user?.userId}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: user._id === user?.userId ? '#f8f9fa' : 'white'
                  }}
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>

                <button
                  onClick={() => fetchUserTodos(user._id)}
                  disabled={todosLoading}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: todosLoading ? 'not-allowed' : 'pointer',
                    opacity: todosLoading ? 0.6 : 1
                  }}
                >
                  {todosLoading ? 'Loading...' : 'View Todos'}
                </button>

                <button
                  onClick={() => updateUserStatus(user._id, !user.isActive)}
                  disabled={user._id === user?.userId}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: user.isActive ? '#dc3545' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: user._id === user?.userId ? 'not-allowed' : 'pointer',
                    opacity: user._id === user?.userId ? 0.6 : 1
                  }}
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </button>

                {user._id === user?.userId && (
                  <span style={{
                    fontSize: '12px',
                    color: '#6c757d',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    (Current User)
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginTop: '20px'
        }}>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            style={{
              padding: '8px 16px',
              backgroundColor: page === 1 ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: page === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>

          <span style={{
            padding: '8px 16px',
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center'
          }}>
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            style={{
              padding: '8px 16px',
              backgroundColor: page === totalPages ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: page === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* User Todos Modal */}
      {showUserTodos && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            width: '90%'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #eee',
              paddingBottom: '10px'
            }}>
              <h3>User Todos</h3>
              <button
                onClick={() => {
                  setShowUserTodos(false);
                  setUserTodos([]);
                  setSelectedUser(null);
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            {userTodos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                <h4>No todos found</h4>
                <p>This user hasn't created any todos yet.</p>
              </div>
            ) : (
              <div>
                {userTodos.map((todo) => (
                  <div
                    key={todo._id}
                    style={{
                      padding: '15px',
                      border: '1px solid #eee',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      backgroundColor: todo.completed ? '#f8f9fa' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          color: todo.completed ? '#6c757d' : '#333',
                          fontSize: '16px',
                          marginBottom: '8px'
                        }}>
                          {todo.text}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{
                            backgroundColor: todo.priority === 'high' ? '#dc3545' :
                                           todo.priority === 'medium' ? '#ffc107' : '#28a745',
                            color: todo.priority === 'medium' ? '#212529' : 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            textTransform: 'uppercase'
                          }}>
                            {todo.priority}
                          </span>

                          <span style={{
                            backgroundColor: '#e9ecef',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}>
                            {todo.category}
                          </span>

                          <span style={{
                            backgroundColor: todo.completed ? '#28a745' : '#ffc107',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}>
                            {todo.completed ? 'Completed' : 'Pending'}
                          </span>
                        </div>

                        <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
                          Created: {new Date(todo.createdAt).toLocaleString()}
                          {todo.dueDate && (
                            <span> • Due: {new Date(todo.dueDate).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
