"use client"

import { useCallback } from "react"
import ReactFlow, {
  type Node,
  type Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Panel,
  addEdge,
} from "reactflow"
import "reactflow/dist/style.css"

// Initial nodes for the graph
const initialNodes: Node[] = [
  {
    id: "document",
    type: "input",
    data: { label: "Document" },
    position: { x: 250, y: 5 },
    style: {
      background: "#f1f5f9",
      border: "1px solid #94a3b8",
      borderRadius: "8px",
      padding: "10px",
      width: 150,
    },
  },
  {
    id: "issued-date",
    data: { label: "Issued Date" },
    position: { x: 100, y: 100 },
    style: {
      background: "#e0f2fe",
      border: "1px solid #7dd3fc",
      borderRadius: "8px",
      padding: "10px",
      width: 150,
    },
  },
  {
    id: "expiration-date",
    data: { label: "Expiration Date" },
    position: { x: 400, y: 100 },
    style: {
      background: "#e0f2fe",
      border: "1px solid #7dd3fc",
      borderRadius: "8px",
      padding: "10px",
      width: 150,
    },
  },
  {
    id: "holder",
    data: { label: "Document Holder" },
    position: { x: 250, y: 200 },
    style: {
      background: "#f0fdf4",
      border: "1px solid #86efac",
      borderRadius: "8px",
      padding: "10px",
      width: 150,
    },
  },
  {
    id: "authority",
    data: { label: "Issuing Authority" },
    position: { x: 100, y: 200 },
    style: {
      background: "#fef9c3",
      border: "1px solid #fde047",
      borderRadius: "8px",
      padding: "10px",
      width: 150,
    },
  },
  {
    id: "auth-level",
    data: { label: "Authorization Level" },
    position: { x: 400, y: 200 },
    style: {
      background: "#fef9c3",
      border: "1px solid #fde047",
      borderRadius: "8px",
      padding: "10px",
      width: 150,
    },
  },
]

// Initial edges for the graph
const initialEdges: Edge[] = [
  {
    id: "doc-to-issued",
    source: "document",
    target: "issued-date",
    animated: true,
    style: { stroke: "#7dd3fc" },
  },
  {
    id: "doc-to-expiration",
    source: "document",
    target: "expiration-date",
    animated: true,
    style: { stroke: "#7dd3fc" },
  },
  {
    id: "doc-to-holder",
    source: "document",
    target: "holder",
    animated: true,
    style: { stroke: "#86efac" },
  },
  {
    id: "doc-to-authority",
    source: "document",
    target: "authority",
    animated: true,
    style: { stroke: "#fde047" },
  },
  {
    id: "doc-to-auth-level",
    source: "document",
    target: "auth-level",
    animated: true,
    style: { stroke: "#fde047" },
  },
]

export default function DocumentFlowGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
        connectionLineType={ConnectionLineType.SmoothStep}
      >
        <Controls />
        <Background color="#aaa" gap={16} />
        <Panel position="top-right">
          <div className="bg-white p-2 rounded-md shadow-sm text-sm">
            <strong>Friday Knowledge Graph</strong>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
