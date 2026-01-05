import React, { useState, useRef } from 'react';
import { Sparkles, Upload, Image as ImageIcon, Download, Eraser, Paintbrush, Save, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { generateImage } from './services/gemini';
import ImageEditor from './components/ImageEditor';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [aspectRatio, setAspectRatio] = useState('auto');
  const [resolution, setResolution] = useState('1k');
  const [count, setCount] = useState(1);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // 'generated' or number (index of uploaded)
  const [editingSubIndex, setEditingSubIndex] = useState(0); // index within generatedImages
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImages(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Gemini API key');
      return;
    }
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const results = await generateImage({
        prompt,
        apiKey,
        images: uploadedImages,
        aspectRatio,
        resolution,
        count
      });
      setGeneratedImages(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = (editedImage) => {
    if (editingIndex === 'generated') {
      const newGenerated = [...generatedImages];
      newGenerated[editingSubIndex] = editedImage;
      setGeneratedImages(newGenerated);
    } else {
      const newImages = [...uploadedImages];
      newImages[editingIndex] = editedImage;
      setUploadedImages(newImages);
    }
    setEditingIndex(null);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar glass ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Sparkles className="icon-sparkle" />
            <span>Gemini Image Pro</span>
          </div>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </button>
        </div>

        <div className="sidebar-content scrollbar-hide">
          <div className="input-group">
            <label className="label">Gemini API Key</label>
            <input
              type="password"
              placeholder="Enter your Gemini API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="helper-text">Your key is kept only in this session.</p>
          </div>

          <div className="input-group">
            <label className="label">Prompt</label>
            <textarea
              placeholder="Describe what you want to create..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>

          <div className="input-row">
            <div className="input-group half">
              <label className="label">Aspect Ratio</label>
              <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                <option value="auto">Auto</option>
                <option value="1:1">1:1 Square</option>
                <option value="4:3">4:3 Standard</option>
                <option value="3:4">3:4 Portrait</option>
                <option value="3:2">3:2 Classic</option>
                <option value="2:3">2:3 Classic Portrait</option>
                <option value="16:9">16:9 Widescreen</option>
                <option value="9:16">9:16 Story</option>
                <option value="21:9">21:9 Cinematic</option>
              </select>
            </div>
            <div className="input-group half">
              <label className="label">Resolution</label>
              <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
                <option value="1k">1K</option>
                <option value="2k">2K</option>
                <option value="4k">4K</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="label">Number of Images</label>
            <select value={count} onChange={(e) => setCount(e.target.value)}>
              <option value={1}>1 Image</option>
              <option value={2}>2 Images</option>
              <option value={3}>3 Images</option>
              <option value={4}>4 Images</option>
            </select>
          </div>

          <div className="input-group">
            <label className="label">Reference Images ({uploadedImages.length})</label>
            <div className="upload-zone" onClick={() => fileInputRef.current.click()}>
              <Upload size={20} />
              <span>Upload Images</span>
              <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                hidden
              />
            </div>
            <div className="image-grid">
              {uploadedImages.map((img, idx) => (
                <div key={idx} className="image-item glass" onClick={() => setEditingIndex(idx)}>
                  <img src={img} alt={`upload-${idx}`} />
                  <div className="image-overlay">
                    <Paintbrush size={16} />
                  </div>
                  <button className="remove-img" onClick={(e) => {
                    e.stopPropagation();
                    setUploadedImages(prev => prev.filter((_, i) => i !== idx));
                  }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            className={`btn btn-primary generate-btn ${isGenerating ? 'loading' : ''}`}
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : (
              <>
                <Sparkles size={18} />
                Generate Image
              </>
            )}
          </button>

          {error && <div className="error-msg">{error}</div>}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {generatedImages.length > 0 ? (
          <div className="results-grid animate-fade-in">
            {generatedImages.map((img, idx) => (
              <div key={idx} className="result-card glass">
                <img src={img} alt={`Generated ${idx}`} className="generated-img" />
                <div className="result-actions">
                  <button className="btn btn-secondary" onClick={() => {
                    setEditingIndex('generated');
                    setEditingSubIndex(idx);
                  }}>
                    <Paintbrush size={18} /> Edit
                  </button>
                  <a href={img} download={`generated-${idx}.png`} className="btn btn-secondary">
                    <Download size={18} /> Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon glass">
              <ImageIcon size={48} />
            </div>
            <h2>Ready to create?</h2>
            <p>Enter a prompt and click generate to see the magic happen.</p>
          </div>
        )}
      </main>

      {/* Editor Modal */}
      {editingIndex !== null && (
        <ImageEditor
          image={editingIndex === 'generated' ? generatedImages[editingSubIndex] : uploadedImages[editingIndex]}
          onSave={handleSaveEdit}
          onClose={() => setEditingIndex(null)}
        />
      )}
    </div>
  );
}

export default App;
