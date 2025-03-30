// src/components/SearchPage/NetworkGraph.js
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import './NetworkGraph.css';

const NetworkGraph = ({ searchResults }) => {
  const svgRef = useRef();
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateNetworkData = useCallback((searchResults) => {
    if (!searchResults || searchResults.length === 0) return null;
    
    const nodes = [];
    const links = [];
    const nodeMap = {};

    const addNode = (id, type) => {
      if (!nodeMap[id]) {
        nodeMap[id] = { id, type };
        nodes.push(nodeMap[id]);
      }
    };

    for (const result of searchResults) {
      const paperTitle = result.title || 'Untitled';
      addNode(paperTitle, 'paper');

      if (result.author && result.author !== 'N/A') {
        const authorList = result.author.split(',').map(a => a.trim());
        authorList.forEach(authorName => {
          addNode(authorName, 'author');
          links.push({
            source: paperTitle,
            target: authorName,
            value: 1
          });
        });

        if (authorList.length > 1) {
          for (let i = 0; i < authorList.length; i++) {
            for (let j = i + 1; j < authorList.length; j++) {
              links.push({
                source: authorList[i],
                target: authorList[j],
                value: 1
              });
            }
          }
        }
      }
    }

    return { nodes, links };
  }, []);

  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      setLoading(true);
      try {
        const netData = generateNetworkData(searchResults);
        setNetworkData(netData);
      } catch (err) {
        console.error('Error generating network data:', err);
        setError('Failed to generate network visualization');
      } finally {
        setLoading(false);
      }
    }
  }, [searchResults, generateNetworkData]);

  useEffect(() => {
    if (!networkData || !networkData.nodes || !networkData.links) return;

    const width = 800;
    const height = 600;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Clear previous graph
    svg.selectAll('*').remove();

    // Create a group for zoom/pan
    const g = svg.append('g');

    // Add zoom/pan behavior
    svg.call(d3.zoom()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      }));

    // Create the simulation
    const simulation = d3.forceSimulation(networkData.nodes)
      .force('link', d3.forceLink(networkData.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(networkData.links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.value));

    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(networkData.nodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles to nodes
    node.append('circle')
      .attr('r', 10)
      .attr('fill', d => {
        if (d.type === 'paper') return '#9370DB';
        if (d.type === 'author') return '#FF7F50';
        return '#4682B4';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add labels to nodes
    node.append('text')
      .attr('dx', 12)
      .attr('dy', '.35em')
      .text(d => d.id.length > 15 ? `${d.id.substring(0, 15)}...` : d.id)
      .style('font-size', '10px')
      .style('pointer-events', 'none');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [networkData]);

  if (loading) {
    return <div className="network-loading">Loading network visualization...</div>;
  }

  if (error) {
    return <div className="network-error">Error: {error}</div>;
  }

  if (!networkData || !networkData.nodes || networkData.nodes.length === 0) {
    return <div className="network-empty">No network data available</div>;
  }

  return (
    <div className="network-graph-container">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default NetworkGraph;