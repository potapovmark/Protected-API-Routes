import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';

const TodoDashboard = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTodo, setNewTodo] = useState({ text: '', priority: 'medium', category: '' });
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, [page, filter]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (filter !== 'all') {
        params.append('completed', filter === 'completed' ? 'true' : 'false');
      }

      const response = await fetch(`/api/protected/todos?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setTodos(data.data.todos);
        setTotalPages(data.data.pagination.pages);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/protected/todos/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch statistics');
    }
  };

  const createTodo = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/protected/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(newTodo)
      });

      const data = await response.json();

      if (data.success) {
        setNewTodo({ text: '', priority: 'medium', category: '' });
        fetchTodos();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create todo');
    }
  };

  const updateTodo = async (id, updates) => {
    try {
      const response = await fetch(`/api/protected/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (data.success) {
        fetchTodos();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to update todo');
    }
  };

  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`/api/protected/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        fetchTodos();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to delete todo');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
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
        Loading todos...
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
          onClick={fetchTodos}
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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1> Todo Dashboard</h1>
          <p>Welcome, {user?.username}!</p>
        </div>
        <button
          onClick={() => {
            if (!showStats) {
              fetchStats();
            }
            setShowStats(!showStats);
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: showStats ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </button>
      </div>

      {/* Statistics */}
      {showStats && stats && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3>📊 Todo Statistics</h3>

          {/* Overview Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 5px 0' }}>{stats.overview.totalTodos}</h4>
              <p style={{ margin: 0, fontSize: '14px' }}>Total Todos</p>
            </div>

            <div style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 5px 0' }}>{stats.overview.completedTodos}</h4>
              <p style={{ margin: 0, fontSize: '14px' }}>Completed</p>
            </div>

            <div style={{
              backgroundColor: '#ffc107',
              color: '#212529',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 5px 0' }}>{stats.overview.pendingTodos}</h4>
              <p style={{ margin: 0, fontSize: '14px' }}>Pending</p>
            </div>

            <div style={{
              backgroundColor: '#dc3545',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 5px 0' }}>{stats.overdueTodos}</h4>
              <p style={{ margin: 0, fontSize: '14px' }}>Overdue</p>
            </div>
          </div>

          {/* Priority Stats */}
          <div style={{ marginBottom: '20px' }}>
            <h4>Priority Distribution</h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                High: {stats.overview.highPriorityTodos}
              </span>
              <span style={{
                backgroundColor: '#ffc107',
                color: '#212529',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                Medium: {stats.overview.mediumPriorityTodos}
              </span>
              <span style={{
                backgroundColor: '#28a745',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                Low: {stats.overview.lowPriorityTodos}
              </span>
            </div>
          </div>

          {/* Category Stats */}
          {stats.categories && stats.categories.length > 0 && (
            <div>
              <h4>Categories</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {stats.categories.map((category, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>{category._id}</span>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                      <span>Total: {category.count}</span>
                      <span style={{ color: '#28a745' }}>Completed: {category.completed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Todo Form */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3>Create New Todo</h3>
        <form onSubmit={createTodo}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Todo text..."
              value={newTodo.text}
              onChange={(e) => setNewTodo({ ...newTodo, text: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <select
              value={newTodo.priority}
              onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>

            <input
              type="text"
              placeholder="Category"
              value={newTodo.category}
              onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value })}
              required
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                flex: 1
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Add Todo
          </button>
        </form>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '20px' }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        >
          <option value="all">All Todos</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Todos List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {todos.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            <h3>No todos found</h3>
            <p>Create your first todo to get started!</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo._id}
              style={{
                padding: '15px 20px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: todo.completed ? '#f8f9fa' : 'white'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={(e) => updateTodo(todo._id, { completed: e.target.checked })}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <span style={{
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? '#6c757d' : '#333'
                  }}>
                    {todo.text}
                  </span>
                  <span
                    style={{
                      backgroundColor: getPriorityColor(todo.priority),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      textTransform: 'uppercase'
                    }}
                  >
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
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                  Created: {new Date(todo.createdAt).toLocaleDateString()}
                </div>
              </div>

              <button
                onClick={() => deleteTodo(todo._id)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Delete
              </button>
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
    </div>
  );
};

export default TodoDashboard;
