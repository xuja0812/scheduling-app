import React from 'react';
import ReactFlow, { 
  Background, 
  Controls,
  Handle,
  Position 
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node component
const CustomNode = ({ data, style }) => {
  return (
    <div style={{
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid',
      minWidth: '150px',
      textAlign: 'center',
      fontSize: '14px',
      fontWeight: 'bold',
      ...style
    }}>
      <Handle type="target" position={Position.Top} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function FlowChart({ eligibleClasses, completedClasses }) {
  console.log("✅ Flow chart eligible classes:", eligibleClasses);
  console.log("✅ Flow chart completed classes:", completedClasses);

  if (!completedClasses || !eligibleClasses) return null;

  const nodes = [];
  const edges = [];
  const completedIds = new Set(completedClasses.map(c => c.id));

  // Add completed course nodes (top row)
  completedClasses.forEach((course, index) => {
    nodes.push({
      id: `completed-${course.id}`,
      type: 'custom',
      position: { x: index * 280, y: 0 },
      data: { label: course.class_name },
      style: { 
        background: '#3b82f6',
        borderColor: '#1d4ed8',
        color: 'white'
      }
    });
  });

  // Add eligible course nodes and group prerequisites
  eligibleClasses.forEach((course, courseIndex) => {
    // Main eligible course node
    nodes.push({
      id: `eligible-${course.id}`,
      type: 'custom',
      position: { x: courseIndex * 300, y: 300 },
      data: { label: course.name },
      style: { 
        background: '#10b981',
        borderColor: '#059669',
        color: 'white',
        minWidth: '180px'
      }
    });

    // Handle prerequisite groups
    if (course.prereq_groups && course.prereq_groups.length > 0) {
      course.prereq_groups.forEach((group, groupIndex) => {
        if (Array.isArray(group) && group.length > 0) {
          
          // If group has multiple prerequisites, create a group node
          if (group.length > 1) {
            const groupNodeId = `group-${course.id}-${groupIndex}`;
            nodes.push({
              id: groupNodeId,
              type: 'custom',
              position: { x: courseIndex * 300 + 50, y: 200 },
              data: { label: `Group ${groupIndex + 1}\n(All Required)` },
              style: { 
                background: '#f59e0b',
                borderColor: '#d97706',
                color: 'white',
                fontSize: '12px',
                minWidth: '120px'
              }
            });

            // Connect group node to eligible course
            edges.push({
              id: `group-edge-${groupNodeId}-${course.id}`,
              source: groupNodeId,
              target: `eligible-${course.id}`,
              animated: true,
              style: { stroke: '#10b981', strokeWidth: 3 },
              label: 'Unlocks'
            });

            // Connect prerequisites to group node
            group.forEach((prereq, prereqIndex) => {
              if (completedIds.has(prereq.id)) {
                edges.push({
                  id: `prereq-to-group-${prereq.id}-${groupNodeId}`,
                  source: `completed-${prereq.id}`,
                  target: groupNodeId,
                  style: { 
                    stroke: '#f59e0b', 
                    strokeWidth: 2,
                    strokeDasharray: '5,5'
                  },
                  label: `Part ${prereqIndex + 1}`
                });
              }
            });

          } else {
            // Single prerequisite - direct connection
            const prereq = group[0];
            if (completedIds.has(prereq.id)) {
              edges.push({
                id: `direct-${prereq.id}-${course.id}`,
                source: `completed-${prereq.id}`,
                target: `eligible-${course.id}`,
                animated: true,
                style: { stroke: '#10b981', strokeWidth: 3 },
                label: 'Direct Path'
              });
            }
          }
        }
      });
    } else {
      // No prerequisites - mark as always available
      const alwaysNodeId = `always-${course.id}`;
      nodes.push({
        id: alwaysNodeId,
        type: 'custom',
        position: { x: courseIndex * 300 + 50, y: 200 },
        data: { label: 'No Prerequisites\nRequired' },
        style: { 
          background: '#8b5cf6',
          borderColor: '#7c3aed',
          color: 'white',
          fontSize: '12px'
        }
      });

      edges.push({
        id: `always-edge-${alwaysNodeId}-${course.id}`,
        source: alwaysNodeId,
        target: `eligible-${course.id}`,
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 3 },
        label: 'Always Available'
      });
    }
  });

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 50 }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}