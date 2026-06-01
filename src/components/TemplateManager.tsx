'use client';

import React, { useState } from 'react';

type Property = {
  keyName: string;
  type: string;
  isRequired: boolean;
};

type TemplatesState = Record<string, Property[]>;

export default function TemplateManager() {
  // Mock State Data
  const [templates, setTemplates] = useState<TemplatesState>({
    project: [
      { keyName: 'DB', type: 'string', isRequired: true },
      { keyName: 'IDE', type: 'string', isRequired: true },
    ],
    knowledge: [],
    troubleshooting: [
      { keyName: 'issue', type: 'string', isRequired: true },
      { keyName: 'solution', type: 'string', isRequired: false },
    ],
  });

  const categories = Object.keys(templates);
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || 'project');

  // Category Add State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      setIsAddingCategory(false);
      return;
    }
    const catName = newCategoryName.trim().toLowerCase();
    if (templates[catName]) {
      alert('Category already exists.');
      return;
    }
    setTemplates((prev) => ({ ...prev, [catName]: [] }));
    setSelectedCategory(catName);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (!window.confirm(`Are you sure you want to delete the category '${catToDelete}' and all its properties?`)) return;

    setTemplates((prev) => {
      const next = { ...prev };
      delete next[catToDelete];
      return next;
    });

    if (selectedCategory === catToDelete) {
      const remaining = categories.filter((c) => c !== catToDelete);
      setSelectedCategory(remaining.length > 0 ? remaining[0] : '');
    }
  };

  // Form State
  const [newKeyName, setNewKeyName] = useState('');
  const [newType, setNewType] = useState('string');
  const [isNewRequired, setIsNewRequired] = useState(false);

  const currentProperties = templates[selectedCategory] || [];

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    // Check for duplicates to prevent schema conflicts
    const isDuplicate = currentProperties.some(
      (prop) => prop.keyName.toLowerCase() === newKeyName.trim().toLowerCase()
    );

    if (isDuplicate) {
      alert('Property name already exists in this category.');
      return;
    }

    const newProperty: Property = {
      keyName: newKeyName.trim(),
      type: newType,
      isRequired: isNewRequired,
    };

    setTemplates((prev) => ({
      ...prev,
      [selectedCategory]: [...(prev[selectedCategory] || []), newProperty],
    }));

    // Reset Form
    setNewKeyName('');
    setNewType('string');
    setIsNewRequired(false);
  };

  const handleDeleteProperty = (keyNameToDelete: string) => {
    if (!window.confirm(`Are you sure you want to delete '${keyNameToDelete}'?`)) return;

    setTemplates((prev) => ({
      ...prev,
      [selectedCategory]: prev[selectedCategory].filter(
        (prop) => prop.keyName !== keyNameToDelete
      ),
    }));
  };

  return (
    <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
      
      {/* Category Selector (Tabs) */}
      <div className="flex space-x-2 mb-8 overflow-x-auto pb-2 scrollbar-hide items-center">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 whitespace-nowrap outline-none ${
              selectedCategory === cat
                ? 'bg-[#007BFF] text-white shadow-lg shadow-[#007BFF]/30'
                : 'bg-white/5 text-white/60 hover:bg-white/15 hover:text-white'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}

        {isAddingCategory ? (
          <div className="flex items-center bg-black/20 rounded-lg px-2 py-1.5 border border-white/20 shrink-0">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCategory();
                }
                if (e.key === 'Escape') {
                  setIsAddingCategory(false);
                  setNewCategoryName('');
                }
              }}
              placeholder="New category..."
              autoFocus
              className="bg-transparent text-white placeholder-white/30 text-sm focus:outline-none w-28 px-2"
            />
            <button onClick={handleAddCategory} className="text-[#007BFF] hover:text-[#0056b3] p-1 transition-colors" title="Save">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
            <button onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }} className="text-red-400 hover:text-red-300 p-1 transition-colors" title="Cancel">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCategory(true)}
            className="px-4 py-2.5 rounded-lg font-medium transition-all duration-200 bg-white/5 text-white/60 hover:bg-white/15 hover:text-white border border-dashed border-white/20 flex items-center justify-center shrink-0"
            title="Add Category"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {selectedCategory ? (
        <>
          {/* Property List */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Properties for <span className="text-[#007BFF] capitalize">{selectedCategory}</span>
              </h2>
              <button
                onClick={() => handleDeleteCategory(selectedCategory)}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 focus:outline-none"
                title="Delete Category"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Category
              </button>
            </div>
            
            {currentProperties.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-white/20 rounded-xl bg-white/5">
                <p className="text-white/50 text-sm">No properties defined for this category.</p>
              </div>
            ) : (
              <ul className="border border-white/10 rounded-xl overflow-hidden bg-white/5 divide-y divide-white/10">
                {currentProperties.map((prop) => (
                  <li key={prop.keyName} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center space-x-4">
                      <span className="font-mono text-white text-base">{prop.keyName}</span>
                      <span className="text-white/40 text-sm bg-black/20 px-2 py-0.5 rounded border border-white/10 capitalize">
                        {prop.type}
                      </span>
                      {prop.isRequired ? (
                        <span className="bg-[#007BFF]/20 text-[#007BFF] border border-[#007BFF]/30 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide">
                          Required
                        </span>
                      ) : (
                        <span className="bg-white/10 text-white/60 border border-white/10 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide">
                          Optional
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteProperty(prop.keyName)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors focus:outline-none"
                      title="Delete Property"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add Property Form */}
          <div className="border-t border-white/20 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Property</h3>
            <form onSubmit={handleAddProperty} className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="flex-1 w-full">
                <label htmlFor="keyName" className="block text-sm font-medium text-white/70 mb-1.5">
                  Property Name
                </label>
                <input
                  type="text"
                  id="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., sourceCodeUrl"
                  className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007BFF]/50 focus:border-[#007BFF] transition-all"
                  required
                />
              </div>
              
              <div className="w-full sm:w-32">
                <label htmlFor="propType" className="block text-sm font-medium text-white/70 mb-1.5">
                  Type
                </label>
                <select
                  id="propType"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#007BFF]/50 focus:border-[#007BFF] transition-all cursor-pointer appearance-none"
                >
                  <option value="string" className="bg-[#232526]">String</option>
                  <option value="number" className="bg-[#232526]">Number</option>
                  <option value="boolean" className="bg-[#232526]">Boolean</option>
                  <option value="date" className="bg-[#232526]">Date</option>
                  <option value="array" className="bg-[#232526]">Array</option>
                </select>
              </div>

              <div className="flex items-center mb-2 sm:mb-0 sm:pb-3 cursor-pointer group" onClick={() => setIsNewRequired(!isNewRequired)}>
                <div className={`w-5 h-5 flex items-center justify-center border-2 rounded mr-2 transition-colors ${isNewRequired ? 'bg-[#007BFF] border-[#007BFF]' : 'border-white/30 bg-black/20 group-hover:border-white/50'}`}>
                  {isNewRequired && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors select-none">Required</span>
              </div>

              <button type="submit" className="w-full sm:w-auto bg-[#007BFF] hover:bg-[#0069d9] text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg shadow-[#007BFF]/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Add Property
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="py-10 text-center border border-dashed border-white/20 rounded-xl bg-white/5">
          <p className="text-white/50 text-sm">No categories available. Please add a new category above.</p>
        </div>
      )}
    </div>
  );
}