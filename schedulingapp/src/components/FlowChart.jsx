import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

// Custom node with tooltip and better styles
const CustomNode = ({ data, style }) => {
  return (
    <div
      title={data.tooltip}
      style={{
        padding: "12px",
        borderRadius: "8px",
        border: "2px solid",
        minWidth: "160px",
        maxWidth: "220px",
        whiteSpace: "normal",
        textAlign: "center",
        fontSize: "14px",
        fontWeight: "bold",
        cursor: "default",
        transition: "box-shadow 0.3s ease",
        ...style,
      }}
      className="custom-node"
    >
      <Handle type="target" position={Position.Top} />
      <div
        style={{
          whiteSpace: "normal",
          wordWrap: "break-word",
          lineHeight: 1.2,
        }}
      >
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const legendStyle = {
  display: "flex",
  justifyContent: "space-around",
  padding: "10px",
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  fontSize: "14px",
  marginBottom: "10px",
  userSelect: "none",
};

const colorBoxStyle = (color) => ({
  width: 20,
  height: 20,
  borderRadius: 4,
  backgroundColor: color,
  marginRight: 8,
  display: "inline-block",
});

export default function FlowChart({ eligibleClasses, completedClasses }) {
  const completedIds = useMemo(
    () => new Set(completedClasses?.map((c) => c.id)),
    [completedClasses]
  );

  if (!completedClasses || !eligibleClasses) return null;

  const nodes = [];
  const edges = [];

  // Completed course nodes (top row)
  completedClasses.forEach((course, index) => {
    nodes.push({
      id: `completed-${course.id}`,
      type: "custom",
      position: { x: index * 260, y: 0 },
      data: {
        label: course.class_name,
        tooltip: `${course.class_name}\nCompleted course\nTrack: ${
          course.track || "N/A"
        }`,
      },
      style: {
        background: "#3b82f6",
        borderColor: "#1e40af",
        color: "white",
        boxShadow: "0 0 8px rgba(59,130,246,0.7)",
        fontWeight: "700",
      },
      selectable: false,
    });
  });

  // Eligible course nodes & prereqs
  eligibleClasses.forEach((course, courseIndex) => {
    // Main eligible course node
    nodes.push({
      id: `eligible-${course.id}`,
      type: "custom",
      position: { x: courseIndex * 280, y: 320 },
      data: {
        label: course.name,
        tooltip: `${course.name}\nTrack: ${course.track || "N/A"}\nCredits: ${
          course.credits || "N/A"
        }`,
      },
      style: {
        background: "#10b981",
        borderColor: "#047857",
        color: "white",
        fontWeight: "700",
        minWidth: "180px",
        boxShadow: "0 0 10px rgba(16,185,129,0.7)",
      },
    });

    if (course.prereq_groups && course.prereq_groups.length > 0) {
      course.prereq_groups.forEach((group, groupIndex) => {
        if (Array.isArray(group) && group.length > 0) {
          // Check if ALL prerequisites in this group are completed
          const groupIsComplete = group.every((prereq) =>
            completedIds.has(prereq.id)
          );

          if (groupIsComplete) {
            if (group.length > 1) {
              // Group node for multiple prereqs (only show if all completed)
              const groupNodeId = `group-${course.id}-${groupIndex}`;
              nodes.push({
                id: groupNodeId,
                type: "custom",
                position: { x: courseIndex * 280 + 70, y: 200 },
                data: {
                  label: `Group ${groupIndex + 1}\n(All Required)`,
                  tooltip: `Prerequisite group: All courses required (completed)`,
                },
                style: {
                  background: "#f59e0b",
                  borderColor: "#b45309",
                  color: "white",
                  fontSize: "12px",
                  minWidth: "120px",
                  fontWeight: "600",
                  boxShadow: "0 0 8px rgba(245,158,11,0.7)",
                },
                selectable: false,
              });

              // Edge from group to course
              edges.push({
                id: `group-edge-${groupNodeId}-${course.id}`,
                source: groupNodeId,
                target: `eligible-${course.id}`,
                animated: true,
                style: { stroke: "#10b981", strokeWidth: 3 },
                label: "Unlocks",
                labelStyle: { fontWeight: "bold", fill: "#065f46" },
                markerEnd: {
                  type: "arrowclosed",
                  color: "#10b981",
                },
              });

              // Edges from completed prereqs to group
              group.forEach((prereq, prereqIndex) => {
                edges.push({
                  id: `prereq-to-group-${prereq.id}-${groupNodeId}`,
                  source: `completed-${prereq.id}`,
                  target: groupNodeId,
                  style: {
                    stroke: "#f59e0b",
                    strokeWidth: 2,
                    strokeDasharray: "5,5",
                  },
                  label: `Part ${prereqIndex + 1}`,
                  labelStyle: { fontSize: 10, fill: "#92400e" },
                  markerEnd: {
                    type: "arrowclosed",
                    color: "#f59e0b",
                  },
                });
              });
            } else {
              // Single prereq direct edge (only show if completed)
              const prereq = group[0];
              const prereqId = prereq.id;
              const prereqCompleted = completedIds.has(prereqId);
              if (prereqCompleted) {
                edges.push({
                  id: `direct-${prereqId}-${course.id}`,
                  source: `completed-${prereqId}`,
                  target: `eligible-${course.id}`,
                  animated: true,
                  style: { stroke: "#10b981", strokeWidth: 3 },
                  label: "Direct Path",
                  labelStyle: { fontWeight: "bold", fill: "#065f46" },
                  markerEnd: {
                    type: "arrowclosed",
                    color: "#10b981",
                  },
                });
              }
            }
          }
          // If groupIsComplete is false => do NOT render this group node or edges
        }
      });
    } else {
      // No prereqs - special node
      const alwaysNodeId = `always-${course.id}`;
      nodes.push({
        id: alwaysNodeId,
        type: "custom",
        position: { x: courseIndex * 280 + 70, y: 200 },
        data: {
          label: "No Prerequisites\nRequired",
          tooltip: "This course is open to all students",
        },
        style: {
          background: "#8b5cf6",
          borderColor: "#5b21b6",
          color: "white",
          fontSize: "12px",
          fontWeight: "600",
          boxShadow: "0 0 8px rgba(139,92,246,0.7)",
        },
        selectable: false,
      });

      edges.push({
        id: `always-edge-${alwaysNodeId}-${course.id}`,
        source: alwaysNodeId,
        target: `eligible-${course.id}`,
        animated: true,
        style: { stroke: "#8b5cf6", strokeWidth: 3 },
        label: "Always Available",
        labelStyle: { fontWeight: "bold", fill: "#5b21b6" },
        markerEnd: {
          type: "arrowclosed",
          color: "#8b5cf6",
        },
      });
    }
  });

  return (
    <div
      style={{
        width: "100%",
        height: "600px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={legendStyle}>
        <div>
          <span style={colorBoxStyle("#3b82f6")} />
          Completed Courses
        </div>
        <div>
          <span style={colorBoxStyle("#10b981")} />
          Eligible Courses
        </div>
        <div>
          <span style={colorBoxStyle("#f59e0b")} />
          Prerequisite Groups (All Required & Completed)
        </div>
        <div>
          <span style={colorBoxStyle("#8b5cf6")} />
          No Prerequisites
        </div>
      </div>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 60 }}
          minZoom={0.3}
          maxZoom={2}
          zoomOnScroll={true}
          zoomOnPinch={true}
          panOnScroll
          attributionPosition="bottom-left"
        >
          <Background gap={16} size={1} />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
