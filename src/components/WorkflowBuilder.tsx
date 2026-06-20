import React, { useState } from "react";
import { BotWorkflowNode, UserRole } from "../types";
import { 
  GitBranch, 
  Sparkles, 
  MessageSquare, 
  Play, 
  HelpCircle, 
  Activity, 
  ArrowRight,
  Plus,
  Trash2,
  RefreshCw,
  Lock
} from "lucide-react";

interface WorkflowBuilderProps {
  currentRole: UserRole;
  nodes: BotWorkflowNode[];
  onSaveNodes: (nodes: BotWorkflowNode[]) => Promise<void>;
  onGenerateWorkflowAI: (goal: string) => Promise<void>;
}

export default function WorkflowBuilder({
  currentRole,
  nodes,
  onSaveNodes,
  onGenerateWorkflowAI
}: WorkflowBuilderProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [aiGoal, setAiGoal] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);

  // Edit fields for active node
  const [editTitle, setEditTitle] = useState("");
  const [editTextContent, setEditTextContent] = useState("");
  const [editActionValue, setEditActionValue] = useState("");

  const isReadOnly = currentRole !== "admin"; // Only Admin can edit bot workflows

  const activeNode = nodes.find(n => n.id === selectedNodeId);

  const handleSelectNode = (node: BotWorkflowNode) => {
    setSelectedNodeId(node.id);
    setEditTitle(node.title);
    setEditTextContent(node.textContent);
    setEditActionValue(node.actionValue || "");
  };

  const handleUpdateNode = async () => {
    if (isReadOnly || !selectedNodeId) return;
    const updatedNodes = nodes.map(n => {
      if (n.id === selectedNodeId) {
        return {
          ...n,
          title: editTitle,
          textContent: editTextContent,
          actionValue: editActionValue
        };
      }
      return n;
    });
    await onSaveNodes(updatedNodes);
  };

  const triggerAIFlowGenerator = async () => {
    if (isReadOnly || !aiGoal.trim()) return;
    setGeneratingAI(true);
    try {
      await onGenerateWorkflowAI(aiGoal);
      setSelectedNodeId(null);
    } catch (err) {
      console.error("AI workflow autogeneration failed", err);
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 flex flex-col gap-6" id="workflow-builder-root">
      
      {/* Autopilots Introduction */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-sans font-bold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-600" />
            No-Code Automated Chatbot Builder
          </h2>
          <p className="text-sm text-gray-500">
            Design multi-branch FAQ triaging, lead routing triggers, and automated WhatsApp replies without coding.
          </p>
        </div>
        {isReadOnly && (
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs px-3 py-1.5 rounded-lg border border-amber-250">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Workflow Locked: Only <strong>Administrator</strong> can write chatbot triggers.</span>
          </div>
        )}
      </div>

      {/* Grid Builder Layout Container */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* 1. Canvas Left Column */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative overflow-hidden h-[420px] shadow-inner" id="workflow-canvas">
            <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[9px] text-slate-800 font-mono font-bold tracking-wider bg-white px-2 py-1 rounded border shadow-sm">
              <Activity className="w-3 h-3 text-green-500 animate-pulse" />
              <span>Canvas active • Connected via Webhook API</span>
            </div>

            {/* Connecting SVG Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 2 L 10 5 L 0 8 z" fill="#4f46e5" />
                </marker>
              </defs>
              {/* Draw connections from node-1 coordinates onwards */}
              {nodes.map((node, i) => {
                // Connect trigger to node-2, and node-2 options to children
                if (node.id === "node-1") {
                  const node2 = nodes.find(n => n.id === "node-2");
                  if (node2) {
                    return (
                      <line 
                      key={i}
                      x1={node.x + 100} 
                      y1={node.y + 40} 
                      x2={node2.x} 
                      y2={node2.y + 40} 
                      stroke="#818cf8" 
                      strokeWidth="2.5" 
                      strokeDasharray="4 2"
                      markerEnd="url(#arrow)" 
                    />
                    );
                  }
                }
                if (node.id === "node-2" && node.options) {
                  return node.options.map((opt, oIdx) => {
                    const nextNode = nodes.find(n => n.id === opt.nextNodeId);
                    if (nextNode) {
                      return (
                        <path
                          key={`${i}-${oIdx}`}
                          d={`M ${node.x + 180} ${node.y + 45 + (oIdx * 12)} C ${node.x + 220} ${node.y + 45 + (oIdx * 12)}, ${nextNode.x - 40} ${nextNode.y + 35}, ${nextNode.x} ${nextNode.y + 35}`}
                          fill="none"
                          stroke="#818cf8"
                          strokeWidth="2"
                          markerEnd="url(#arrow)"
                        />
                      );
                    }
                    return null;
                  });
                }
                return null;
              })}
            </svg>

            {/* Draggable/Selectable Nodes on Layout */}
            <div className="absolute inset-0 z-10" style={{ pointerEvents: 'none' }}>
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                
                return (
                  <button
                    key={node.id}
                    onClick={() => handleSelectNode(node)}
                    style={{ 
                      position: 'absolute', 
                      left: `${node.x}px`, 
                      top: `${node.y}px`,
                      pointerEvents: 'auto'
                    }}
                    className={`p-3 rounded-lg border text-left shadow-md w-52 transition-all transition-transform hover:-translate-y-0.5 flex flex-col gap-1.5 ${
                      isSelected 
                        ? "bg-slate-900 text-white border-indigo-500 ring-2 ring-indigo-500/20" 
                        : node.type === "trigger"
                        ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                        : node.type === "action"
                        ? "bg-indigo-50 text-indigo-900 border-indigo-300"
                        : "bg-white text-slate-800 border-slate-200"
                    }`}
                    id={`canvas-node-${node.id}`}
                  >
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-bold">
                        {node.type} node
                      </span>
                      <span className="text-[10px] font-bold font-mono">#{node.id}</span>
                    </div>

                    <h4 className="font-sans font-bold text-xs">{node.title}</h4>
                    <p className="text-[10px] opacity-80 line-clamp-3 leading-snug">{node.textContent}</p>

                    {node.options && (
                      <div className="flex flex-col gap-0.5 mt-1 border-t border-slate-100 pt-1">
                        {node.options.map((opt, oIdx) => (
                          <div key={opt.id} className="text-[9px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-650 flex justify-between">
                            <span>{opt.label}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-indigo-500" />
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Visual Inspector / AI Helper Right Column */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          
          {/* AI Workflow Generation triggers */}
          {!isReadOnly && (
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-4 rounded-xl border border-slate-800 text-white flex flex-col gap-3">
              <div>
                <h4 className="font-sans text-sm font-bold text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  AI Workflow Autogenerator
                </h4>
                <p className="text-[10.5px] text-slate-300">
                  Provide your business checklist requirement, and Gemini will reconstruct 5 connected script nodes automatically.
                </p>
              </div>

              <textarea
                value={aiGoal}
                onChange={(e) => setAiGoal(e.target.value)}
                placeholder="e.g., Audit collection scheduler or Criminal Law consultations triager check list..."
                className="w-full text-xs p-2 bg-slate-800 border border-slate-705 rounded outline-none h-16 resize-none focus:border-indigo-500 text-white"
                id="ai-workflow-prompt-textarea"
              />

              <button
                onClick={triggerAIFlowGenerator}
                disabled={generatingAI || !aiGoal.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs transition duration-200 flex items-center justify-center gap-2 border border-indigo-700 shadow-sm"
                id="ai-workflow-generate-submit"
              >
                {generatingAI ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Constructing Nodes...</span>
                  </>
                ) : (
                  <>
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Deploy AI Campaign Bot</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Node Inspector */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
            <h4 className="font-sans text-sm font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-slate-600" />
              Node Inspector
            </h4>

            {activeNode ? (
              <div className="flex flex-col gap-3 text-xs" id="node-inspector-fields">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Selected Type: <strong className="uppercase text-slate-700">{activeNode.type}</strong></span>
                  <span>ID: #{activeNode.id}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-sans font-bold text-slate-700 uppercase tracking-wider text-[9.5px]">Title Label</label>
                  <input
                    type="text"
                    value={editTitle}
                    disabled={isReadOnly}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="p-2 border border-slate-200 rounded outline-none bg-white font-medium"
                    id="node-edit-title"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-sans font-bold text-slate-700 uppercase tracking-wider text-[9.5px]">Script text response</label>
                  <textarea
                    value={editTextContent}
                    disabled={isReadOnly}
                    onChange={(e) => setEditTextContent(e.target.value)}
                    className="p-2 border border-slate-200 rounded outline-none bg-white h-24 font-mono leading-relaxed"
                    id="node-edit-script"
                  />
                </div>

                {activeNode.type === "action" && (
                  <div className="flex flex-col gap-1">
                    <label className="font-sans font-bold text-slate-700 uppercase tracking-wider text-[9.5px]">Action Parameter</label>
                    <input
                      type="text"
                      value={editActionValue}
                      disabled={isReadOnly}
                      onChange={(e) => setEditActionValue(e.target.value)}
                      className="p-2 border border-slate-200 rounded outline-none bg-white font-mono"
                      id="node-edit-action-param"
                    />
                  </div>
                )}

                {!isReadOnly && (
                  <button
                    onClick={handleUpdateNode}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-850 rounded font-bold transition shadow-sm mt-1"
                    id="save-edited-node-btn"
                  >
                    Save Node Configuration
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center p-8 text-slate-400 text-xs flex flex-col items-center justify-center gap-1 italic border border-dashed border-slate-200 rounded-lg bg-white">
                <HelpCircle className="w-5 h-5 text-slate-300 mb-1" />
                <span>Select a physical node on the workflow canvas to inspect and edit its automated script rules.</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
