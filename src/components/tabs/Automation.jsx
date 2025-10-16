import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import 'reactflow/dist/style.css';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState
} from 'reactflow';

const accentColor = '#fb923c';

const palette = [
  { type: 'input', label: 'Trigger', description: 'Start the flow from schedule, webhook, or app event.' },
  { type: 'default', label: 'HTTP Request', description: 'Call external APIs or internal services.' },
  { type: 'default', label: 'Code', description: 'Transform payloads using custom JavaScript.' },
  { type: 'default', label: 'AI Chain', description: 'Call LLMs, summarise content, trigger AI agents.' },
  { type: 'output', label: 'Notify', description: 'Send email, Slack, or in-app notification.' }
];

const initialNodes = [
  {
    id: '1',
    type: 'input',
    position: { x: 80, y: 200 },
    data: { label: 'Gmail Trigger' },
    style: {
      borderRadius: 16,
      border: `1px solid ${accentColor}`,
      background: 'white',
      padding: 12,
      width: 200
    }
  },
  {
    id: '2',
    type: 'output',
    position: { x: 460, y: 200 },
    data: { label: 'Reply to message' },
    style: {
      borderRadius: 16,
      border: '1px solid #cbd5f5',
      background: 'white',
      padding: 12,
      width: 200
    }
  }
];

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    style: { stroke: '#475467', strokeWidth: 2 }
  }
];

const Automation = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState(initialNodes[0].id);

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId), [nodes, selectedNodeId]);

  const handleConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#475467', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const handleAddNode = (item) => {
    const id = `${Date.now()}`;
    const type = item.type;
    const index = nodes.filter((node) => node.type === type).length + 1;
    setNodes((current) => [
      ...current,
      {
        id,
        type,
        position: { x: 160 + current.length * 40, y: 140 + current.length * 40 },
        data: { label: `${item.label} ${index}` },
        style: {
          borderRadius: 16,
          border: '1px solid #cbd5f5',
          background: 'white',
          padding: 12,
          width: 220
        }
      }
    ]);
    setSelectedNodeId(id);
  };

  const handleNodeClick = useCallback((_, node) => setSelectedNodeId(node.id), []);

  const handleDeleteNode = (nodeId) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setEdges((prev) => prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNodeId((current) => (current === nodeId ? null : current));
  };

  const handleDuplicateNode = (nodeId) => {
    const node = nodes.find((item) => item.id === nodeId);
    if (!node) return;
    const id = `${Date.now()}`;
    setNodes((prev) => [
      ...prev,
      {
        ...node,
        id,
        position: { x: node.position.x + 60, y: node.position.y + 40 },
        data: { label: `${node.data.label} copy` }
      }
    ]);
    setSelectedNodeId(id);
  };

  const handleNodeLabelChange = (nodeId, label) => {
    setNodes((prev) => prev.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, label } } : node)));
  };

  const handleRemoveEdge = (edgeId) => {
    setEdges((prev) => prev.filter((edge) => edge.id !== edgeId));
  };

  const edgesForSelected = useMemo(() => edges.filter((edge) => edge.source === selectedNodeId || edge.target === selectedNodeId), [edges, selectedNodeId]);

  return (
    <Stack spacing={4} sx={{ height: '100%' }}>
      <Stack spacing={1}>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          Automation canvas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Sketch BeWorking automations visually. Drag nodes, connect steps, and sync the workflow with your n8n instance.
        </Typography>
      </Stack>

      <Grid container spacing={3} sx={{ flex: 1, minHeight: 520 }}>
        <Grid item xs={12} md={3} lg={3}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2, height: '100%' }}>
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Palette
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose blocks to add to the flow.
                </Typography>
              </Stack>
              <Divider />
              <Stack spacing={1.5}>
                {palette.map((item) => (
                  <Paper
                    key={item.label}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      '&:hover': { borderColor: accentColor, bgcolor: 'rgba(251,146,60,0.08)' }
                    }}
                    onClick={() => handleAddNode(item)}
                  >
                    <Typography variant="subtitle2" fontWeight="bold">
                      {item.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.description}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={6}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <ReactFlow
              nodes={nodes}
              onNodesChange={onNodesChange}
              edges={edges}
              onEdgesChange={onEdgesChange}
              onConnect={handleConnect}
              onNodeClick={handleNodeClick}
              fitView
              attributionPosition="bottom-right"
            >
              <Background gap={32} color="#e4e7ec" />
              <Controls position="top-left" />
              <MiniMap pannable nodeColor={() => accentColor} />
            </ReactFlow>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3} lg={3}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2, height: '100%' }}>
            {selectedNode ? (
              <Stack spacing={2} sx={{ height: '100%' }}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Node details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Configure <strong>{selectedNode.data.label}</strong>.
                  </Typography>
                </Stack>
                <TextField
                  label="Display name"
                  value={selectedNode.data.label}
                  onChange={(event) => handleNodeLabelChange(selectedNode.id, event.target.value)}
                  size="small"
                />
                <Divider />
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Quick actions
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Duplicate node">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ContentCopyRoundedIcon fontSize="small" />}
                        sx={{ 
                          minWidth: 120,
                          height: 36,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: accentColor,
                          color: accentColor,
                          '&:hover': {
                            borderColor: '#f97316',
                            color: '#f97316',
                            backgroundColor: 'rgba(251, 146, 60, 0.08)',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(251, 146, 60, 0.2)'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                        onClick={() => handleDuplicateNode(selectedNode.id)}
                      >
                        DUPLICATE
                      </Button>
                    </Tooltip>
                    <Tooltip title="Delete node">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DeleteOutlineRoundedIcon fontSize="small" sx={{ color: '#6b7280' }} />}
                        sx={{ 
                          minWidth: 120,
                          height: 36,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: '#f97316', 
                          color: '#f97316', 
                          '&:hover': { 
                            borderColor: '#ea580c', 
                            color: '#ea580c',
                            backgroundColor: 'rgba(249, 115, 22, 0.08)',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                        onClick={() => handleDeleteNode(selectedNode.id)}
                      >
                        DELETE
                      </Button>
                    </Tooltip>
                  </Stack>
                </Stack>
                <Divider />
                <Stack spacing={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Connect to…
                  </Typography>
                  <MenuList dense sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 160, overflowY: 'auto' }}>
                    {nodes
                      .filter((node) => node.id !== selectedNode.id)
                      .map((node) => (
                        <MenuItem key={node.id} onClick={() => handleConnect({ source: selectedNode.id, target: node.id })}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <AddRoundedIcon fontSize="small" />
                            <Typography variant="body2">{node.data.label}</Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                  </MenuList>
                </Stack>
                <Divider />
                <Stack spacing={1} sx={{ flex: 1, overflowY: 'auto' }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Linked edges
                  </Typography>
                  {edgesForSelected.length === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      No edges yet. Connect this node to another step.
                    </Typography>
                  )}
                  {edgesForSelected.map((edge) => {
                    const partnerId = edge.source === selectedNode.id ? edge.target : edge.source;
                    const partner = nodes.find((node) => node.id === partnerId);
                    if (!partner) return null;
                    return (
                      <Paper key={edge.id} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                          <Typography variant="body2">{partner.data.label}</Typography>
                          <Tooltip title="Remove connection">
                            <Button
                              variant="text"
                              size="small"
                              color="error"
                              onClick={() => handleRemoveEdge(edge.id)}
                            >
                              Remove
                            </Button>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
                <Divider />
                <Button 
                  variant="contained" 
                  size="small" 
                  sx={{ 
                    minWidth: 120,
                    height: 36,
                    textTransform: 'none',
                    fontWeight: 600,
                    backgroundColor: accentColor, 
                    color: 'white',
                    '&:hover': { 
                      backgroundColor: '#f97316' 
                    } 
                  }} 
                  startIcon={<PlayArrowRoundedIcon />}
                >
                  TEST NODE
                </Button>
              </Stack>
            ) : (
              <Stack spacing={1.5} alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Select a node
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Choose a block in the canvas to edit configuration and connections.
                </Typography>
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default Automation;
