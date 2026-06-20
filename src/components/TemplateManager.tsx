'use client';

import React, { useState, useEffect } from 'react';
import { addTemplateAction, deleteTemplateAction } from './actions';
import { addPropertyAction, deletePropertyAction, getAllPropertiesWithTypesAction, updatePropertyTypeAction } from './propertyActions';

export type Property = {
  propertyName: string;
  type: string;
  isRequired: boolean;
};

export type TemplatesState = Record<string, Property[]>;

const getTypeColor = (type: string) => {
  switch (type) {
    case 'string': return 'text-emerald-500';
    case 'number': return 'text-amber-500';
    case 'boolean': return 'text-rose-500';
    case 'array': return 'text-cyan-500';
    case 'date': return 'text-violet-500';
    default: return 'text-gray-500';
  }
};

const SYSTEM_PROPS = ['title', 'category1', 'summary', 'content', 'category2', 'category3', 'category4', 'tags', 'parentskill', 'childskill', 'techstart', 'projectname', 'location'];

export default function TemplateManager({ initialTemplates }: { initialTemplates: TemplatesState }) {
  // DB Fetch State Data
  const [templates, setTemplates] = useState<TemplatesState>(initialTemplates);
  const [globalProps, setGlobalProps] = useState<{name: string, type: string}[]>([]);

  useEffect(() => {
    getAllPropertiesWithTypesAction().then((props) => {
      if (props && props.length > 0) {
        setGlobalProps(props);
      }
    });
  }, []);

  const templateNames = Object.keys(templates);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templateNames[0] || '');

  // Template Add State
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddTemplate = async () => {
    if (!newTemplateName.trim()) {
      setIsAddingTemplate(false);
      return;
    }
    const tempName = newTemplateName.trim().toLowerCase();
    if (templates[tempName]) {
      alert('Template already exists.');
      return;
    }

    setIsSaving(true);
    const result = await addTemplateAction(tempName);
    setIsSaving(false);

    if (!result.success) {
      alert(result.message);
      return;
    }

    setTemplates((prev) => ({ ...prev, [tempName]: [] }));
    setSelectedTemplate(tempName);
    setNewTemplateName('');
    setIsAddingTemplate(false);
  };

  const handleDeleteTemplate = async (templateToDelete: string) => {
    if (!window.confirm(`Are you sure you want to delete the template '${templateToDelete}' and all its properties?`)) return;

    setIsSaving(true);
    const result = await deleteTemplateAction(templateToDelete);
    setIsSaving(false);

    if (!result.success) {
      alert(result.message);
      return;
    }

    setTemplates((prev) => {
      const next = { ...prev };
      delete next[templateToDelete];
      return next;
    });

    if (selectedTemplate === templateToDelete) {
      const remaining = templateNames.filter((t) => t !== templateToDelete);
      setSelectedTemplate(remaining.length > 0 ? remaining[0] : '');
    }
  };

  // Form State
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newType, setNewType] = useState('string');
  const [isNewRequired, setIsNewRequired] = useState(false);
  const [templateContents, setTemplateContents] = useState<Record<string, string>>({});

  const currentProperties = templates[selectedTemplate] || [];

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropertyName.trim() || isSaving) return;

    // Check for duplicates to prevent schema conflicts
    const isDuplicate = currentProperties.some(
      (prop) => prop.propertyName.toLowerCase() === newPropertyName.trim().toLowerCase()
    );

    if (isDuplicate) {
      alert('Property name already exists in this template.');
      return;
    }

    setIsSaving(true);
    const result = await addPropertyAction(selectedTemplate, newPropertyName.trim(), newType, isNewRequired);
    setIsSaving(false);

    if (!result.success) {
      alert(result.message);
      return;
    }

    const newProperty: Property = {
      propertyName: newPropertyName.trim(),
      type: newType,
      isRequired: isNewRequired,
    };

    setTemplates((prev) => ({
      ...prev,
      [selectedTemplate]: [...(prev[selectedTemplate] || []), newProperty],
    }));

    // Reset Form
    setNewPropertyName('');
    setNewType('string');
    setIsNewRequired(false);
  };

  const handleDeleteProperty = async (propertyNameToDelete: string) => {
    if (!window.confirm(`Are you sure you want to delete '${propertyNameToDelete}'?`)) return;

    setIsSaving(true);
    const result = await deletePropertyAction(selectedTemplate, propertyNameToDelete);
    setIsSaving(false);

    if (!result.success) {
      alert(result.message);
      return;
    }

    setTemplates((prev) => ({
      ...prev,
      [selectedTemplate]: prev[selectedTemplate].filter(
        (prop) => prop.propertyName !== propertyNameToDelete
      ),
    }));
  };

  const handleUpdateType = async (propertyName: string, newType: string) => {
    const result = await updatePropertyTypeAction(propertyName, newType);
    if (!result.success) {
      alert(result.message);
      return;
    }

    // 전체 템플릿 목록 순회하며 동일한 글로벌 속성의 타입 일괄 업데이트
    setTemplates((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((tempName) => {
        next[tempName] = next[tempName].map((prop) =>
          prop.propertyName === propertyName ? { ...prop, type: newType } : prop
        );
      });
      return next;
    });
    setGlobalProps((prev) => prev.map(p => p.name === propertyName ? { ...p, type: newType } : p));
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      
      {/* Template Selector (Tabs) */}
      <div className="flex space-x-2 mb-1 overflow-x-auto pb-2 scrollbar-hide items-center">
        {templateNames.map((templateName) => (
          <button
            key={templateName}
            onClick={() => setSelectedTemplate(templateName)}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 whitespace-nowrap outline-none ${
              selectedTemplate === templateName
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200'
            }`}
          >
            {templateName.charAt(0).toUpperCase() + templateName.slice(1)}
          </button>
        ))}

        {isAddingTemplate ? (
          <div className="flex items-center bg-gray-50 rounded-lg px-2 py-2 border border-gray-200 shrink-0">
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (isSaving) return;
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTemplate();
                }
                if (e.key === 'Escape') {
                  setIsAddingTemplate(false);
                  setNewTemplateName('');
                }
              }}
              placeholder="New template..."
              autoFocus
              disabled={isSaving}
              className="bg-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none w-28 px-2 disabled:opacity-50"
            />
            <button onClick={handleAddTemplate} disabled={isSaving} className="text-blue-600 hover:text-blue-800 p-1 transition-colors disabled:opacity-50" title="Save">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
            <button onClick={() => { setIsAddingTemplate(false); setNewTemplateName(''); }} disabled={isSaving} className="text-red-500 hover:text-red-700 p-1 transition-colors disabled:opacity-50" title="Cancel">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTemplate(true)}
            className="px-4 py-1.5 rounded-lg transition-all duration-200 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 border border-dashed border-gray-300 flex items-center justify-center shrink-0"
            title="Add Template"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {selectedTemplate ? (
        <>
          {/* Add Property Form */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Property</h3>
            <form onSubmit={handleAddProperty} className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="flex-1 w-full">
                <label htmlFor="propertyName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Property Name
                </label>
                <input
                  type="text"
                  id="propertyName"
                  list="global-props-list"
                  value={newPropertyName}
                  disabled={isSaving}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewPropertyName(val);
                    const existingProp = globalProps.find(p => p.name === val.trim());
                    if (existingProp) {
                      setNewType(existingProp.type);
                    }
                  }}
                  placeholder="e.g., sourceCodeUrl"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  required
                  autoComplete="off"
                />
                <datalist id="global-props-list">
                  {globalProps.map((prop) => (
                    <option key={prop.name} value={prop.name} />
                  ))}
                </datalist>
              </div>
              
              <div className="w-full sm:w-32">
                <label htmlFor="propType" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Type
                </label>
                <select
                  id="propType"
                  value={newType}
                  disabled={isSaving || globalProps.some(p => p.name === newPropertyName.trim())}
                  onChange={(e) => setNewType(e.target.value)}
                  className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white appearance-none cursor-pointer disabled:opacity-50 font-semibold ${getTypeColor(newType)}`}
                >
                  <option value="string" className="text-gray-900 font-medium">String</option>
                  <option value="number" className="text-gray-900 font-medium">Number</option>
                  <option value="boolean" className="text-gray-900 font-medium">Boolean</option>
                  <option value="date" className="text-gray-900 font-medium">Date</option>
                  <option value="array" className="text-gray-900 font-medium">Array</option>
                </select>
              </div>

              <div className={`flex items-center mb-2 sm:mb-0 sm:pb-3 group ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => !isSaving && setIsNewRequired(!isNewRequired)}>
                <div className={`w-5 h-5 flex items-center justify-center border rounded mr-2 transition-colors ${isNewRequired ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
                  {isNewRequired && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors select-none">Required</span>
              </div>

              <button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold shadow-sm transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Add Property
              </button>
            </form>
          </div>

          {/* Property List */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Properties for <span className="text-blue-600 capitalize">{selectedTemplate}</span>
              </h2>
              <button
                onClick={() => handleDeleteTemplate(selectedTemplate)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors text-sm font-medium flex items-center gap-1.5 focus:outline-none"
                title="Delete Template"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Template
              </button>
            </div>
            
            {currentProperties.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-gray-300 rounded-xl bg-gray-50">
                <p className="text-gray-500 text-sm">No properties defined for this template.</p>
              </div>
            ) : (
              <ul className="border border-gray-200 rounded-xl overflow-hidden bg-white divide-y divide-gray-200">
                {currentProperties.map((prop) => {
                  const isSystemProp = SYSTEM_PROPS.includes(prop.propertyName);
                  return (
                  <li key={prop.propertyName} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors gap-4">
                    <div className="flex items-center space-x-4 flex-1">
                      <select
                        value={prop.type || 'string'}
                        onChange={(e) => handleUpdateType(prop.propertyName, e.target.value)}
                        className={`${getTypeColor(prop.type || 'string')} font-semibold text-xs bg-gray-100 px-1 py-0.5 rounded border border-gray-200 capitalize w-[68px] text-center shrink-0 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white ${isSystemProp ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-gray-200 transition-colors'}`}
                        title={isSystemProp ? "System property type cannot be changed" : "Click to edit type"}
                        disabled={isSystemProp}
                        style={{ textAlignLast: 'center' }}
                      >
                        <option value="string" className="text-gray-900 font-medium">String</option>
                        <option value="number" className="text-gray-900 font-medium">Number</option>
                        <option value="boolean" className="text-gray-900 font-medium">Boolean</option>
                        <option value="date" className="text-gray-900 font-medium">Date</option>
                        <option value="array" className="text-gray-900 font-medium">Array</option>
                      </select>
                      <span className="font-mono text-gray-900 font-medium text-base w-1/3 sm:w-1/4 shrink-0 truncate" title={prop.propertyName}>{prop.propertyName}</span>
                      <input
                        type="text"
                        placeholder="value"
                        className="block w-full max-w-[200px] bg-transparent rounded-md border border-transparent px-3 py-1 text-sm text-gray-700 placeholder:text-gray-400 hover:bg-gray-100 focus:border-gray-200 focus:bg-white focus:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-100 focus:shadow-sm transition-all duration-200"
                      />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {prop.isRequired ? (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide">
                          Required
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide">
                          Optional
                        </span>
                      )}
                      <button
                        disabled={isSaving}
                        onClick={() => handleDeleteProperty(prop.propertyName)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors focus:outline-none"
                        title="Delete Property"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Template Content Box */}
            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all bg-white">
              <textarea
                value={templateContents[selectedTemplate] || ''}
                onChange={(e) => setTemplateContents(prev => ({ ...prev, [selectedTemplate]: e.target.value }))}
                placeholder="Write the default markdown content for this template here..."
                className="w-full h-64 p-4 text-sm text-gray-800 font-mono focus:outline-none resize-y bg-transparent"
              />
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => alert('Content save functionality requires backend implementation.')}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm active:scale-95 disabled:opacity-50"
                >
                  Save Content
                </button>
              </div>
            </div>
        </>
      ) : (
      <div className="py-10 text-center border border-dashed border-gray-300 rounded-xl bg-gray-50">
        <p className="text-gray-500 text-sm">No templates available. Please add a new template above.</p>
        </div>
      )}
    </div>
  );
}