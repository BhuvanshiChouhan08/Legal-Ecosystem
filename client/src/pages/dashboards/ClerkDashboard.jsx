import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Plus, FileText, Upload, Calendar, MapPin, LogOut, User, Bell, Search } from 'lucide-react';
import { API_BASE_URL } from '../../lib/api';

const ClerkDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [prioritySignal, setPrioritySignal] = useState(null);
  const [prioritySignalError, setPrioritySignalError] = useState('');
  const [isPredictingPriority, setIsPredictingPriority] = useState(false);

  const [complaintForm, setComplaintForm] = useState({
    caseType: '',
    description: '',
    date: '',
    area: '',
    documentFileName: '' // will store uploaded file name
  });

  // ===== File upload related states =====
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState(""); // backend filename returned

  const recentComplaints = [
    { id: 'VV2024001234', type: 'Property Dispute', date: '2024-01-20', status: 'In Progress', priority: 'High' },
    { id: 'VV2024001235', type: 'Civil Matter', date: '2024-01-19', status: 'Under progress', priority: 'Low' },
    { id: 'VV2024001236', type: 'Criminal Case', date: '2024-01-18', status: 'Resolved', priority: 'High' },
    { id: 'VV2024001237', type: 'Family Law', date: '2024-01-17', status: 'In Progress', priority: 'Medium' },
    { id: 'VV2024001238', type: 'Contract Dispute', date: '2026-06-10', status:'Asigned', priority: 'Medium' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  // ===== File selection handler (Step 2) =====
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setUploadMsg("");
  };

  // ===== Upload handler (Step 3) =====
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadMsg("⚠️ Please select a file first.");
      return;
    }

    const formData = new FormData();
    // Backend expects field name "file" (your uploadRoutes uses upload.single("file"))
    // We'll only send the first file for now
    formData.append("file", selectedFiles[0]);

    try {
      setUploadMsg("Uploading...");
      const res = await fetch(`${API_BASE_URL}/api/upload/upload-document`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      // your uploadRoutes returns: { status: "success", filename: "...", message: "..."}
      if (data && (data.status === "success" || data.filename)) {
        const fname = data.filename || data.filePath || data.filename;
        setUploadedFileName(fname);
        // add to complaintForm as metadata
        setComplaintForm(prev => ({ ...prev, documentFileName: fname }));
        setUploadMsg("✅ File uploaded successfully: " + fname);
      } else {
        setUploadMsg("❌ Upload failed. Try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadMsg("❌ Server error: Could not upload file.");
    }
  };

  // ===== Complaint submit (includes uploaded file info) =====
  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare payload including any uploaded filename
      const payload = {
        ...complaintForm,
        documentFileName: uploadedFileName || complaintForm.documentFileName || null
      };

      const response = await fetch(`${API_BASE_URL}/api/clerk/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Complaint submitted successfully! Complaint ID: ${data.id || data._id || "N/A"}`);
        setShowComplaintForm(false);
        setComplaintForm({
          caseType: "",
          description: "",
          date: "",
          area: "",
          documentFileName: ""
        });
        setSelectedFiles([]);
        setUploadedFileName("");
        setUploadMsg("");
        setActiveTab('dashboard');
      } else {
        const errText = await response.text();
        console.error("Submit failed:", errText);
        alert("Failed to submit complaint.");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("Error connecting to the server.");
    }
  };

  const handlePriorityPrediction = async () => {
    setPrioritySignal(null);
    setPrioritySignalError('');
    setIsPredictingPriority(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/clerk/priority-prediction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseType: complaintForm.caseType }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not get model estimate.');
      setPrioritySignal(result);
    } catch (error) {
      setPrioritySignalError(error.message || 'Could not connect to the prediction service.');
    } finally {
      setIsPredictingPriority(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'in progress': return 'text-blue-600 bg-blue-100';
      case 'assigned': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <Scale className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">LegalEcosystem</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700 font-medium">Court Clerk Dashboard</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cases..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Bell className="h-6 w-6 text-gray-500 hover:text-blue-600 cursor-pointer" />
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Scale className="h-5 w-5" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab('submit')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'submit' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Plus className="h-5 w-5" />
                  <span>Submit Complaint</span>
                </button>
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'recent' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <span>Recent Complaints</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm">Today's Submissions</p>
                        <p className="text-3xl font-bold text-gray-900">12</p>
                      </div>
                      <Plus className="h-12 w-12 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm">Pending Review</p>
                        <p className="text-3xl font-bold text-gray-900">25</p>
                      </div>
                      <FileText className="h-12 w-12 text-yellow-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm">High Priority</p>
                        <p className="text-3xl font-bold text-gray-900">8</p>
                      </div>
                      <Calendar className="h-12 w-12 text-red-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm">Total This Month</p>
                        <p className="text-3xl font-bold text-gray-900">156</p>
                      </div>
                      <Scale className="h-12 w-12 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button 
                      onClick={() => setActiveTab('submit')}
                      className="flex items-center justify-center space-x-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Plus className="h-5 w-5 text-blue-600" />
                      <span className="text-blue-700 font-medium">New Complaint</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                      <Upload className="h-5 w-5 text-green-600" />
                      <span className="text-green-700 font-medium">Upload Documents</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <span className="text-purple-700 font-medium">Schedule Hearing</span>
                    </button>
                    <Link 
                      to="/tracking"
                      className="flex items-center justify-center space-x-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                    >
                      <Search className="h-5 w-5 text-orange-600" />
                      <span className="text-orange-700 font-medium">Track Case</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'submit' && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit New Complaint</h2>
                <form onSubmit={handleComplaintSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Case Type</label>
                      <select
                        value={complaintForm.caseType}
                        onChange={(e) => {
                          setComplaintForm({...complaintForm, caseType: e.target.value});
                          setPrioritySignal(null);
                          setPrioritySignalError('');
                        }}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Case Type</option>
                        <option value="civil">Civil Matter</option>
                        <option value="criminal">Criminal Case</option>
                        <option value="property">Property Dispute</option>
                        <option value="family">Family Law</option>
                        <option value="contract">Contract Dispute</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Clerk-assigned priority</label>
                      <select
                        value={complaintForm.priority}
                        onChange={(e) => setComplaintForm({...complaintForm, priority: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <button
                        type="button"
                        onClick={handlePriorityPrediction}
                        disabled={!complaintForm.caseType || isPredictingPriority}
                        className="mt-3 rounded-lg border border-blue-300 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isPredictingPriority ? 'Estimating…' : 'Get optional model estimate'}
                      </button>
                      <p className="mt-2 text-xs text-gray-500">
                        Experimental binary estimate from a small dataset. It does not set or replace your priority choice.
                      </p>
                      {prioritySignal?.available && (
                        <div role="status" className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                          <strong>Dataset label {prioritySignal.label}</strong> · model probability {(prioritySignal.probability * 100).toFixed(1)}%.
                          <span className="block mt-1">This label is not Low, Medium, or High. Review the case independently.</span>
                        </div>
                      )}
                      {prioritySignal && !prioritySignal.available && (
                        <div role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                          <strong>Prediction unavailable:</strong> {prioritySignal.reason}
                          <span className="block mt-1">
                            Holdout accuracy {Math.round(prioritySignal.evaluation.accuracy * 100)}% matched the majority-class baseline; positive-label recall was {Math.round(prioritySignal.evaluation.positive_class_recall * 100)}%.
                          </span>
                          <span className="block mt-1">Please assign priority using normal human review.</span>
                        </div>
                      )}
                      {prioritySignalError && <p role="alert" className="mt-2 text-sm text-red-600">{prioritySignalError}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={complaintForm.date}
                        onChange={(e) => setComplaintForm({...complaintForm, date: e.target.value})}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Area/Jurisdiction</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={complaintForm.area}
                          onChange={(e) => setComplaintForm({...complaintForm, area: e.target.value})}
                          required
                          placeholder="Enter area or jurisdiction"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={complaintForm.description}
                      onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                      required
                      rows="6"
                      placeholder="Provide detailed description of the complaint..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Documents</label>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />

                      <p className="text-gray-600 mb-3">Select files to upload</p>

                      {/* File selector */}
                      <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-700"
                      />

                      {/* Show selected files */}
                      {selectedFiles.length > 0 && (
                        <div className="mt-3 text-left text-sm text-gray-700">
                          <strong>Selected Files:</strong>
                          <ul className="list-disc ml-5">
                            {selectedFiles.map((f, index) => (
                              <li key={index}>{f.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Upload button */}
                      <button
                        type="button"
                        onClick={handleUpload}
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Upload Files
                      </button>

                      {/* Upload message */}
                      {uploadMsg && (
                        <p className="mt-3 text-sm font-medium text-green-600">{uploadMsg}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Submit Complaint
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'recent' && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Complaints</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Complaint ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Priority</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentComplaints.map((complaint) => (
                        <tr key={complaint.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-blue-600">{complaint.id}</td>
                          <td className="py-3 px-4">{complaint.type}</td>
                          <td className="py-3 px-4">{complaint.date}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                              {complaint.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                              {complaint.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClerkDashboard;


