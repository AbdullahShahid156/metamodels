import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UploadCloud, CheckCircle2, FileUp, X, ImagePlus, Loader2, Plus, FileText, Info } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const CreateListing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    type: 'model',
    name: '',
    description: '',
    category: 'General',
    version: '1.0.0',
    rent_price: '',
    buy_price: '',
    trainingDetails: '',
    supportedFramework: '',
    useCase: ''
  });

  useEffect(() => {
    const name = searchParams.get('name');
    const description = searchParams.get('description');
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    if (name || description || category || type) {
      setFormData(prev => ({
        ...prev,
        name: name || prev.name,
        description: description || prev.description,
        category: category || prev.category,
        type: type || prev.type
      }));
    }
  }, [searchParams]);

  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [ipfsHash, setIpfsHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Instruction Document State
  const [instructionDocFile, setInstructionDocFile] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [instructionDocHash, setInstructionDocHash] = useState('');

  // Showcase images state
  const [showcaseImages, setShowcaseImages] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Capabilities state
  const [capabilities, setCapabilities] = useState([]);
  const [capabilityInput, setCapabilityInput] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const setListingType = (type) => {
    setFormData(prev => ({ ...prev, type }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to upload assets');
        setIsUploading(false);
        return;
      }

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch(`${apiBase}/ipfs/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formDataUpload
      });

      const data = await response.json();

      if (response.ok) {
        setIpfsHash(data.ipfsHash);
        toast.success('File successfully uploaded to IPFS via Pinata');
      } else {
        toast.error(data.error || 'IPFS upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Network error during IPFS upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setInstructionDocFile(e.target.files[0]);
    }
  };

  const handleDocUpload = async () => {
    if (!instructionDocFile) {
      toast.error('Please select an instruction document to upload');
      return;
    }

    setIsUploadingDoc(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to upload assets');
        setIsUploadingDoc(false);
        return;
      }

      const formDataUpload = new FormData();
      formDataUpload.append('file', instructionDocFile);

      const response = await fetch(`${apiBase}/ipfs/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formDataUpload
      });

      const data = await response.json();

      if (response.ok) {
        setInstructionDocHash(data.ipfsHash);
        toast.success('Instruction Document successfully uploaded to IPFS');
      } else {
        toast.error(data.error || 'IPFS upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Network error during IPFS upload');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Showcase image upload handler
  const handleShowcaseImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const imgFile = files[i];

        // Validate image type
        if (!imgFile.type.startsWith('image/')) {
          toast.error(`${imgFile.name} is not an image file`);
          continue;
        }

        const formDataUpload = new FormData();
        formDataUpload.append('file', imgFile);

        const response = await fetch(`${apiBase}/ipfs/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formDataUpload
        });

        const data = await response.json();
        if (response.ok) {
          const imageUrl = `https://gateway.pinata.cloud/ipfs/${data.ipfsHash}`;
          setShowcaseImages(prev => [...prev, imageUrl]);
        } else {
          toast.error(`Failed to upload ${imgFile.name}`);
        }
      }
      toast.success('Images uploaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Image upload failed');
    } finally {
      setIsUploadingImage(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  const removeShowcaseImage = (index) => {
    setShowcaseImages(prev => prev.filter((_, i) => i !== index));
  };

  // Capabilities handlers
  const addCapability = () => {
    const trimmed = capabilityInput.trim();
    if (trimmed && !capabilities.includes(trimmed)) {
      setCapabilities(prev => [...prev, trimmed]);
      setCapabilityInput('');
    }
  };

  const handleCapabilityKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCapability();
    }
  };

  const removeCapability = (index) => {
    setCapabilities(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ipfsHash) {
      toast.error('Please upload your file to IPFS first');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const payload = {
        ...formData,
        rent_price: parseFloat(formData.rent_price) || 0,
        buy_price: parseFloat(formData.buy_price) || 0,
        model_card_url: ipfsHash,
        architecture_notes: instructionDocHash || null,
        rent_enabled: !!formData.rent_price,
        buy_enabled: !!formData.buy_price,
        capabilities: capabilities,
        showcase_images: showcaseImages,
      };

      const response = await fetch(`${apiBase}/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        window.scrollTo(0, 0);
        setShowSuccessModal(true);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create listing');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto px-4 py-12 w-full"
    >
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Create New Listing</h1>
          <p className="text-[#64748b]">Upload and list your asset on the marketplace.</p>
        </div>

        {/* Type Selector Toggle */}
        <div className="bg-[#1C2035] p-1 rounded-xl border border-white/[0.04] inline-flex">
          <button
            type="button"
            onClick={() => setListingType('model')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'model' ? 'bg-[#27272a] text-white shadow-sm' : 'text-[#64748b] hover:text-white'
              }`}
          >
            AI Model
          </button>
          <button
            type="button"
            onClick={() => setListingType('agent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'agent' ? 'bg-[#27272a] text-white shadow-sm' : 'text-[#64748b] hover:text-white'
              }`}
          >
            AI Agent
          </button>
        </div>
      </div>

      <div className="glass-card-static p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={`${formData.type === 'model' ? 'Model' : formData.type === 'agent' ? 'Agent' : 'Asset'} Name`}
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={formData.type === 'agent' ? "e.g. CodeAssistPro" : formData.type === 'model' ? "e.g. VisionPro V1" : "e.g. Custom API"}
                required
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#94a3b8]">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#E2B340]/50 transition-all"
                >
                  <option value="General" className="bg-[#1C2035]">General</option>
                  <option value="LLM" className="bg-[#1C2035]">LLM</option>
                  <option value="NLP" className="bg-[#1C2035]">NLP</option>
                  <option value="Vision" className="bg-[#1C2035]">Vision</option>
                  <option value="Coding" className="bg-[#1C2035]">Coding</option>
                  <option value="Audio" className="bg-[#1C2035]">Audio</option>
                  <option value="Agents" className="bg-[#1C2035]">Agents</option>
                  <option value="Tools" className="bg-[#1C2035]">Tools</option>
                  <option value="Other" className="bg-[#1C2035]">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#E2B340]/50 transition-all"
                placeholder={`Describe your ${formData.type.toLowerCase()}'s capabilities...`}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Version"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Rent Price ($)"
                name="rent_price"
                type="number"
                value={formData.rent_price}
                onChange={handleInputChange}
                placeholder="0"
              />
              <Input
                label="Buy Price ($)"
                name="buy_price"
                type="number"
                value={formData.buy_price}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Conditional Fields based on Type */}
              {formData.type === 'model' ? (
                <div className="sm:col-span-2">
                  <Input
                    label="Training Data Details"
                    name="trainingDetails"
                    value={formData.trainingDetails}
                    onChange={handleInputChange}
                    placeholder="e.g. 10B language tokens"
                  />
                </div>
              ) : formData.type === 'agent' ? (
                <>
                  <Input
                    label="Supported Framework"
                    name="supportedFramework"
                    value={formData.supportedFramework}
                    onChange={handleInputChange}
                    placeholder="e.g. LangChain, AutoGen"
                  />
                  <Input
                    label="Primary Use Case"
                    name="useCase"
                    value={formData.useCase}
                    onChange={handleInputChange}
                    placeholder="e.g. Code Review"
                  />
                </>
              ) : (
                <div className="sm:col-span-2">
                  <Input
                    label="Specific Details"
                    name="trainingDetails"
                    value={formData.trainingDetails}
                    onChange={handleInputChange}
                    placeholder="e.g. Custom scripts or tools"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Capabilities Input ── */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-[#94a3b8] mb-3">Capabilities</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={capabilityInput}
                onChange={(e) => setCapabilityInput(e.target.value)}
                onKeyDown={handleCapabilityKeyDown}
                placeholder="e.g. Code Generation, Real-time Analytics..."
                className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#E2B340]/50 transition-all"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addCapability}
                className="px-4 shrink-0"
              >
                <Plus size={16} />
              </Button>
            </div>
            {capabilities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {capabilities.map((cap, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                      bg-[#E2B340]/10 border border-[#E2B340]/20 text-[#F0D060]"
                  >
                    {cap}
                    <button
                      type="button"
                      onClick={() => removeCapability(i)}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </motion.span>
                ))}
              </div>
            )}
            <p className="text-xs text-[#6B7280] mt-2">Press Enter or click + to add. These appear on your product page.</p>
          </div>

          {/* ── Showcase Images Upload ── */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-[#94a3b8] mb-3">
              Showcase Images
              <span className="text-[#6B7280] font-normal ml-2">— Screenshots, outputs, demos</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {showcaseImages.map((url, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative group aspect-video rounded-xl overflow-hidden border border-white/[0.08] bg-[#141828]"
                >
                  <img
                    src={url}
                    alt={`Showcase ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeShowcaseImage(index)}
                      className="p-2 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/40 transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* Add Image Button */}
              <label className="aspect-video rounded-xl border-2 border-dashed border-white/[0.08] bg-white/[0.01] hover:border-[#E2B340]/30 hover:bg-[#E2B340]/[0.03] transition-all flex flex-col items-center justify-center cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleShowcaseImageUpload}
                  disabled={isUploadingImage}
                />
                {isUploadingImage ? (
                  <Loader2 size={24} className="text-[#E2B340] animate-spin" />
                ) : (
                  <>
                    <ImagePlus size={24} className="text-[#6B7280] group-hover:text-[#F0D060] transition-colors mb-1.5" />
                    <span className="text-xs text-[#6B7280] group-hover:text-[#64748b] transition-colors">Add Images</span>
                  </>
                )}
              </label>
            </div>
            <p className="text-xs text-[#6B7280]">Upload screenshots, model outputs, or demo visuals. These appear on your product page.</p>
          </div>

          {/* ── Model File Upload (IPFS) ── */}
          <div className="pt-4 pb-2">
            <label className="block text-sm font-medium text-[#94a3b8] mb-3">Upload Model File (IPFS)</label>
            <div className="border-2 border-dashed border-white/[0.08] rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center text-center bg-white/[0.01]">
              {!ipfsHash ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-[#E2B340]/10 flex items-center justify-center mb-4 text-[#F0D060]">
                    <UploadCloud size={28} />
                  </div>

                  <div className="mb-6">
                    <p className="text-white text-sm font-medium mb-1">Select your file</p>
                    <p className="text-xs text-[#6B7280]">ZIP, TAR, or ONNX format (max 5GB)</p>
                  </div>

                  <input
                    type="file"
                    id="model-file"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => document.getElementById('model-file').click()}
                    >
                      Choose File
                    </Button>
                    <Button
                      type="button"
                      onClick={handleUpload}
                      disabled={!file || isUploading}
                      className="gap-2"
                    >
                      {isUploading ? (
                        <>Uploading...</>
                      ) : (
                        <>
                          <FileUp size={16} /> Upload to IPFS
                        </>
                      )}
                    </Button>
                  </div>
                  {file && <p className="mt-4 text-xs text-[#F0D060] font-medium">Selected: {file.name}</p>}
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-full bg-[#10b981]/10 flex items-center justify-center mb-4 text-[#34d399]">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="text-white font-semibold mb-1">Upload Successful</h3>
                  <p className="text-[#34d399] font-medium text-sm mb-1">Your file is safe and securely stored on IPFS!</p>
                  <p className="text-[#6B7280] text-xs mb-4">It is decentralized and immutable.</p>

                  <div className="bg-[#0C0F1A] border border-white/[0.08] rounded-xl px-4 py-3 flex items-center gap-3 w-full max-w-sm">
                    <span className="text-xs text-[#64748b] font-medium">Hash</span>
                    <span className="text-xs text-[#F0D060] font-mono break-all text-left">{ipfsHash}</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* ── Instruction Document Upload (Optional) ── */}
          <div className="pt-4 pb-2">
            <label className="block text-sm font-medium text-[#94a3b8] mb-3">
              Instruction Document <span className="text-[#6B7280] font-normal ml-2">— Optional</span>
            </label>
            <div className="border border-dashed border-white/[0.08] rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 bg-white/[0.01]">
              {!instructionDocHash ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-[#8B8CF8]/10 flex items-center justify-center text-[#8B8CF8] shrink-0">
                    <FileText size={24} />
                  </div>

                  <div className="flex-grow text-center sm:text-left">
                    <p className="text-white text-sm font-medium mb-0.5">Upload Docs</p>
                    <p className="text-xs text-[#6B7280] mb-3 sm:mb-0">PDF, MD, or TXT file with usage instructions</p>
                  </div>

                  <input
                    type="file"
                    id="doc-file"
                    className="hidden"
                    onChange={handleDocFileChange}
                  />

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => document.getElementById('doc-file').click()}
                    >
                      {instructionDocFile ? 'Change' : 'Choose File'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleDocUpload}
                      disabled={!instructionDocFile || isUploadingDoc}
                      className="gap-2"
                    >
                      {isUploadingDoc ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <FileUp size={14} />
                      )}
                      {isUploadingDoc ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 rounded-full bg-[#10b981]/10 flex items-center justify-center text-[#34d399] shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-white text-sm font-semibold mb-0.5">Document Uploaded</h3>
                    <p className="text-xs text-[#6B7280] truncate max-w-[200px] sm:max-w-md">{instructionDocHash}</p>
                  </div>
                </div>
              )}
            </div>
            {instructionDocFile && !instructionDocHash && <p className="mt-2 text-xs text-[#8B8CF8] font-medium px-1">Selected: {instructionDocFile.name}</p>}
          </div>

          <div className="pt-4 border-t border-white/[0.04]">
            <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
            </Button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Listing Submitted"
      >
        <div className="text-center py-4 px-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#E2B340]/15 flex items-center justify-center mb-5 border border-[#E2B340]/20">
            <Info className="text-[#F0D060]" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Pending Review</h2>
          <p className="text-[#94a3b8] mb-6 leading-relaxed text-sm">
            Your asset has been successfully submitted and is currently in the review process. It will be automatically published to the marketplace once approved.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/seller/listings')} className="w-full py-2.5">
              View My Listings
            </Button>
            <Button variant="secondary" onClick={() => {
              setShowSuccessModal(false);
              setFormData(prev => ({ ...prev, name: '', description: '', rent_price: '', buy_price: '' }));
              setIpfsHash('');
              setInstructionDocHash('');
              setShowcaseImages([]);
            }} className="w-full py-2.5">
              Create Another
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};
