// src/App.js
import './App.css';
import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, FileText, Upload, Send, Eye, X, UserPlus } from 'lucide-react';
import { login, register, submitProject, getProjects, reviewProject } from './api';

export default function ProjectApprovalSystem() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('student');
  const [regDepartment, setRegDepartment] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    abstract: '',
    technology: '',
    teamMembers: '',
    document: ''
  });
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAction, setReviewAction] = useState('');

  // ----------------------------
  // Load projects when currentUser changes (after login)
  // ----------------------------
  useEffect(() => {
    const loadProjects = async () => {
      if (!currentUser) return;
      try {
        const token = localStorage.getItem('token');
        const data = await getProjects(token);
        if (Array.isArray(data)) {
          setProjects(data);
        } else if (data && data.projects) {
          setProjects(data.projects);
        } else {
          setProjects([]);
        }
      } catch (err) {
        console.error('Failed to load projects', err);
        setProjects([]);
      }
    };
    loadProjects();
  }, [currentUser]);

  // ----------------------------
  // REGISTER (calls backend)
  // ----------------------------
  const handleRegister = async () => {
    if (!regName || !regEmail || !regPassword || !regDepartment) {
      alert('Please fill all fields');
      return;
    }
    if (!regEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    if (regPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const res = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        department: regDepartment
      });

      if (res?.error) {
        alert(res.message || 'Registration failed');
        return;
      }

      alert('Registration successful! You can now login.');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegDepartment('');
      setShowRegister(false);
    } catch (err) {
      console.error(err);
      alert('Registration failed');
    }
  };

  // ----------------------------
  // LOGIN (calls backend)
  // ----------------------------
  const handleLogin = async () => {
    try {
      const res = await login({
        email: loginEmail,
        password: loginPassword,
      });

      if (!res || res.error || !res.token) {
        alert(res?.message || 'Invalid credentials! Please check your email and password.');
        return;
      }

      localStorage.setItem('token', res.token);
      // backend returns user object in res.user
      setCurrentUser(res.user);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  };

  // ----------------------------
  // LOGOUT
  // ----------------------------
  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setActiveView('dashboard');
    setProjects([]);
  };

  // ----------------------------
  // SUBMIT PROJECT (calls backend)
  // ----------------------------
  const handleSubmitProject = async () => {
    if (!newProject.title || !newProject.abstract || !newProject.technology || !newProject.teamMembers || !newProject.document) {
      alert('Please fill all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await submitProject(newProject, token);

      if (res?.error) {
        alert(res.message || 'Failed to submit project');
        return;
      }

      // success
      alert('Project submitted successfully!');
      // refresh projects
      const updated = await getProjects(token);
      if (Array.isArray(updated)) setProjects(updated);
      else if (updated?.projects) setProjects(updated.projects);
      setNewProject({ title: '', abstract: '', technology: '', teamMembers: '', document: '' });
      setActiveView('dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to submit project');
    }
  };

  // ----------------------------
  // REVIEW PROJECT (calls backend)
  // ----------------------------
  const handleReview = async (action) => {
    if (!reviewComment.trim()) {
      alert('Please provide feedback comments');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const projectId = selectedProject._id || selectedProject.id;
      const res = await reviewProject(projectId, { action, comment: reviewComment }, token);

      if (res?.error) {
        alert(res.message || 'Failed to submit review');
        return;
      }

      alert('Project ' + action + ' successfully!');
      // refresh projects
      const updated = await getProjects(token);
      if (Array.isArray(updated)) setProjects(updated);
      else if (updated?.projects) setProjects(updated.projects);

      setShowModal(false);
      setReviewComment('');
      setReviewAction('');
      setSelectedProject(null);
    } catch (err) {
      console.error(err);
      alert('Review failed');
    }
  };

  // ----------------------------
  // STATUS BADGE
  // ----------------------------
  const getStatusBadge = (status) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending Review' },
      'faculty-approved': { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: 'Faculty Approved' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Rejected' },
      'needs-revision': { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, text: 'Needs Revision' }
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ' + config.color}>
        <Icon size={14} /> {config.text}
      </span>
    );
  };

  // ----------------------------
  // GET PROJECTS FOR USER (filtering)
  // supports projects.student._id OR projects.studentId OR projects.studentId (string)
  // ----------------------------
  const getProjectsForUser = () => {
    if (!currentUser) return [];

    if (currentUser.role === 'student') {
      const myId = currentUser.id || currentUser._id || (currentUser._id && currentUser._id.toString && currentUser._id.toString());
      return projects.filter(p => {
        const sid = p.student?._id || p.studentId || p.student;
        if (!sid) return false;
        return sid.toString() === myId?.toString();
      });
    } else if (currentUser.role === 'faculty') {
      return projects.filter(p => p.status === 'pending' || p.status === 'faculty-approved');
    }
    return projects;
  };

  const userProjects = getProjectsForUser();

  // ----------------------------
  // STATS
  // ----------------------------
  // const getStats = () => {
  //   const total = projects.length;
  //   const pending = projects.filter(p => p.status === 'pending').length;
  //   const approved = projects.filter(p => p.status === 'approved').length;
  //   const rejected = projects.filter(p => p.status === 'rejected').length;
  //   return { total, pending, approved, rejected };
  // };

  
  const stats = {
    total: projects.length,
    pending: projects.filter(p => p.status === "pending").length,
    approved: projects.filter(p => p.status === "approved").length,
    rejected: projects.filter(p => p.status === "rejected").length
};
  //const stats = getStats();
  // -------------------------------------------------
  // RENDER: If not logged in show Login/Register UI
  // (UI not changed except wiring to backend)
  // -------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <FileText className="mx-auto mb-4 text-indigo-600" size={48} />
            <h1 className="text-3xl font-bold text-gray-800">Project Approval System</h1>
            <p className="text-gray-600 mt-2">{showRegister ? 'Create your account' : 'Login to continue'}</p>
          </div>
          {!showRegister ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="your.email@college.edu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter password"
                />
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Login
              </button>
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setShowRegister(true)}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Register here
                  </button>
                </p>
              </div>
              
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="your.email@college.edu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Min. 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Re-enter password"
                />
              </div>
              <button
                onClick={handleRegister}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center gap-2"
              >
                <UserPlus size={18} /> Register
              </button>
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => setShowRegister(false)}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Login here
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------
  // RENDER: Authenticated UI (unchanged design)
  // -------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText size={32} />
            <div>
              <h1 className="text-xl font-bold">Project Approval System</h1>
              <p className="text-sm text-indigo-200">{currentUser.name} ({currentUser.role.toUpperCase()})</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-lg transition">
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveView('dashboard')}
              className={'px-4 py-3 font-medium border-b-2 transition ' + (activeView === 'dashboard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900')}
            >
              Dashboard
            </button>
            {currentUser.role === 'student' && (
              <button
                onClick={() => setActiveView('submit')}
                className={'px-4 py-3 font-medium border-b-2 transition ' + (activeView === 'submit' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900')}
              >
                Submit Project
              </button>
            )}
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveView('analytics')}
                className={'px-4 py-3 font-medium border-b-2 transition ' + (activeView === 'analytics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900')}
              >
                Analytics
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeView === 'dashboard' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Projects</p>
                    <p className="text-3xl font-bold text-gray-800">{currentUser.role === 'student' ? userProjects.length : stats.total}</p>
                  </div>
                  <FileText className="text-indigo-600" size={32} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="text-yellow-600" size={32} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Approved</p>
                    <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                  </div>
                  <CheckCircle className="text-green-600" size={32} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Rejected</p>
                    <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                  </div>
                  <AlertCircle className="text-red-600" size={32} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">
                  {currentUser.role === 'student' ? 'My Projects' : currentUser.role === 'faculty' ? 'Projects for Review' : 'All Projects'}
                </h2>
              </div>
              <div className="divide-y">
                {userProjects.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FileText className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No projects found</p>
                    {currentUser.role === 'student' && (
                      <button
                        onClick={() => setActiveView('submit')}
                        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                      >
                        Submit Your First Project
                      </button>
                    )}
                  </div>
                ) : (
                  userProjects.map(project => (
                    <div key={project._id || project.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800">{project.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{project.abstract}</p>
                        </div>
                        {getStatusBadge(project.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div><span className="font-medium">Technology:</span> {project.technology}</div>
                        <div><span className="font-medium">Team:</span> {project.teamMembers}</div>
                        <div><span className="font-medium">Student:</span> {project.student?.name || project.studentName}</div>
                        <div><span className="font-medium">Submitted:</span> {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : project.submittedAt ? new Date(project.submittedAt).toLocaleDateString() : ''}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedProject(project); setReviewAction(''); setShowModal(true); }}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                        >
                          <Eye size={16} /> View Details
                        </button>
                        {currentUser.role === 'faculty' && project.status === 'pending' && (
                          <>
                            <button
                              onClick={() => { setSelectedProject(project); setReviewAction('approved'); setShowModal(true); }}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => { setSelectedProject(project); setReviewAction('rejected'); setShowModal(true); }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {currentUser.role === 'admin' && project.status === 'faculty-approved' && (
                          <>
                            <button
                              onClick={() => { setSelectedProject(project); setReviewAction('approved'); setShowModal(true); }}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                            >
                              Final Approve
                            </button>
                            <button
                              onClick={() => { setSelectedProject(project); setReviewAction('revision'); setShowModal(true); }}
                              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm"
                            >
                              Request Revision
                            </button>
                            <button
                              onClick={() => { setSelectedProject(project); setReviewAction('rejected'); setShowModal(true); }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'submit' && currentUser.role === 'student' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Submit New Project</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Abstract</label>
                <textarea
                  value={newProject.abstract}
                  onChange={(e) => setNewProject({...newProject, abstract: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Technology Stack</label>
                <input
                  type="text"
                  value={newProject.technology}
                  onChange={(e) => setNewProject({...newProject, technology: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., React, Node.js, MongoDB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
                <input
                  type="text"
                  value={newProject.teamMembers}
                  onChange={(e) => setNewProject({...newProject, teamMembers: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., John Doe, Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document (filename)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newProject.document}
                    onChange={(e) => setNewProject({...newProject, document: e.target.value})}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="proposal.pdf"
                  />
                  <Upload className="text-gray-400" size={20} />
                </div>
              </div>
              <button
                onClick={handleSubmitProject}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center gap-2"
              >
                <Send size={20} /> Submit Project
              </button>
            </div>
          </div>
        )}

        {activeView === 'analytics' && currentUser.role === 'admin' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Project Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Status Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending</span>
                    <span className="font-bold text-yellow-600">{stats.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Approved</span>
                    <span className="font-bold text-green-600">{stats.approved}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rejected</span>
                    <span className="font-bold text-red-600">{stats.rejected}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Approval Rate</h3>
                <div className="text-center">
                  <div className="text-5xl font-bold text-indigo-600">
                    {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
                  </div>
                  <p className="text-gray-600 mt-2">of projects approved</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Project Details</h3>
              <button onClick={() => { setShowModal(false); setReviewComment(''); setReviewAction(''); setSelectedProject(null); }} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700">Title</h4>
                <p className="text-gray-600">{selectedProject.title}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Abstract</h4>
                <p className="text-gray-600">{selectedProject.abstract}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Technology</h4>
                <p className="text-gray-600">{selectedProject.technology}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Team Members</h4>
                <p className="text-gray-600">{selectedProject.teamMembers}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Status</h4>
                <div className="mt-1">{getStatusBadge(selectedProject.status)}</div>
              </div>

              {selectedProject.facultyReview && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">Faculty Review</h4>
                  <p className="text-sm text-gray-600"><span className="font-medium">Action:</span> {selectedProject.facultyReview.action}</p>
                  <p className="text-sm text-gray-600"><span className="font-medium">Reviewed by:</span> {selectedProject.facultyReview.reviewedBy}</p>
                  <p className="text-sm text-gray-600"><span className="font-medium">Comments:</span> {selectedProject.facultyReview.comment}</p>
                </div>
              )}

              {selectedProject.adminReview && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">Admin Review</h4>
                  <p className="text-sm text-gray-600"><span className="font-medium">Action:</span> {selectedProject.adminReview.action}</p>
                  <p className="text-sm text-gray-600"><span className="font-medium">Reviewed by:</span> {selectedProject.adminReview.reviewedBy}</p>
                  <p className="text-sm text-gray-600"><span className="font-medium">Comments:</span> {selectedProject.adminReview.comment}</p>
                </div>
              )}

              {reviewAction && (currentUser.role === 'faculty' || currentUser.role === 'admin') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Comments</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    rows={4}
                    placeholder="Enter your feedback..."
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleReview(reviewAction)}
                      className={'px-6 py-2 rounded-lg text-white font-medium ' + (reviewAction === 'approved' ? 'bg-green-600 hover:bg-green-700' : reviewAction === 'revision' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700')}
                    >
                      Submit {reviewAction === 'approved' ? 'Approval' : reviewAction === 'revision' ? 'Revision Request' : 'Rejection'}
                    </button>
                    <button
                      onClick={() => { setShowModal(false); setReviewComment(''); setReviewAction(''); }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
