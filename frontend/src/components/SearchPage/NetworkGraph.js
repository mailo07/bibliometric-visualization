// src/components/SearchPage/NetworkGraph.js
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import './NetworkGraph.css';

const NetworkGraph = ({ searchResults }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [layoutMode, setLayoutMode] = useState('force'); // force, radial, cluster
  const [showLabels, setShowLabels] = useState(true);
  const [highlightMode, setHighlightMode] = useState('none'); // none, citations, authors

  // Generate network data with citations and co-authorship
  const generateNetworkData = useCallback((searchResults) => {
    if (!searchResults || searchResults.length === 0) return null;
    
    const nodes = [];
    const links = [];
    const nodeMap = {};
    
    // Helper function to add a node if it doesn't exist
    const addNode = (id, type, metadata = {}) => {
      if (!nodeMap[id]) {
        nodeMap[id] = { 
          id, 
          type, 
          citations: metadata.citations || 0,
          year: metadata.year || null,
          journal: metadata.journal || null,
          connections: 0,
          ...metadata
        };
        nodes.push(nodeMap[id]);
      }
      return nodeMap[id];
    };

    // Add all papers first
    for (const result of searchResults) {
      const paperTitle = result.title || 'Untitled';
      const year = result.year || result.publication_year || result.published || 'Unknown';
      const journal = result.journal || result.publisher || result.source || 'Unknown';
      const citations = result.cited_by || result.citations || result.citation_count || 0;
      
      addNode(paperTitle, 'paper', { 
        citations, 
        year: typeof year === 'string' ? year.substring(0, 4) : year,
        journal,
        authors: result.author || 'Unknown'
      });
    }

    // Add authors and connections
    for (const result of searchResults) {
      const paperTitle = result.title || 'Untitled';
      const paperNode = nodeMap[paperTitle];
      
      // Add author nodes and paper-author links
      if (result.author && result.author !== 'N/A') {
        const authorList = result.author.split(',').map(a => a.trim());
        authorList.forEach(authorName => {
          const authorNode = addNode(authorName, 'author', { papers: [paperTitle] });
          
          // Create link between paper and author
          links.push({
            source: paperTitle,
            target: authorName,
            value: 1,
            type: 'paper-author'
          });
          
          // Increment connection count for both nodes
          paperNode.connections++;
          authorNode.connections++;
        });

        // Create co-authorship links
        if (authorList.length > 1) {
          for (let i = 0; i < authorList.length; i++) {
            for (let j = i + 1; j < authorList.length; j++) {
              links.push({
                source: authorList[i],
                target: authorList[j],
                value: 1,
                type: 'co-author'
              });
              
              // Increment connection count for both authors
              nodeMap[authorList[i]].connections++;
              nodeMap[authorList[j]].connections++;
            }
          }
        }
      }
    }

    // Add citation links between papers (using dummy data since we don't have actual citations)
    // In a real implementation, you would use actual citation data from your API
    for (let i = 0; i < searchResults.length; i++) {
      const paper1 = searchResults[i];
      const paper1Title = paper1.title || 'Untitled';
      
      // Find some papers to connect as citations (for demonstration)
      for (let j = 0; j < searchResults.length; j++) {
        if (i === j) continue;
        
        const paper2 = searchResults[j];
        const paper2Title = paper2.title || 'Untitled';
        
        // Create citation links based on some heuristics
        // In a real implementation, use actual citation data
        const paper1Year = paper1.year || paper1.publication_year || 0;
        const paper2Year = paper2.year || paper2.publication_year || 0;
        
        // Only create citation link if paper1 is older than paper2
        if (paper1Year < paper2Year && Math.random() > 0.7) {
          links.push({
            source: paper2Title,
            target: paper1Title,
            value: 1,
            type: 'citation'
          });
          
          // Increment connection count
          nodeMap[paper2Title].connections++;
          nodeMap[paper1Title].connections++;
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

  // Function to get node size based on type and citations/connections
  const getNodeSize = (d) => {
    if (d.type === 'paper') {
      // Scale paper nodes by citation count (min 8, max 25)
      return Math.max(8, Math.min(25, 8 + Math.sqrt(d.citations) * 1.5));
    } else if (d.type === 'author') {
      // Scale author nodes by connection count (min 6, max 18)
      return Math.max(6, Math.min(18, 6 + d.connections * 0.8));
    }
    return 8; // Default size
  };

  // Function to get node color based on type and other attributes
  const getNodeColor = (d) => {
    if (d.type === 'paper') {
      // Color papers by journal or year ranges
      if (d.year) {
        const year = parseInt(d.year);
        if (year < 2000) return '#9467bd'; // purple for older papers
        if (year < 2010) return '#8c564b'; // brown for 2000s
        if (year < 2020) return '#e377c2'; // pink for 2010s
        return '#2ca02c'; // green for 2020s
      }
      return '#9370DB'; // Default purple for papers
    }
    
    if (d.type === 'author') {
      return '#FF7F50'; // Coral for authors
    }
    
    return '#4682B4'; // Default Steel Blue
  };

  // Function to get link style based on type
  const getLinkStyle = (d) => {
    if (d.type === 'citation') {
      return {
        stroke: '#2ca02c', // Green for citations
        strokeWidth: 1.5,
        strokeDasharray: '5,5' // Dashed line for citations
      };
    } else if (d.type === 'co-author') {
      return {
        stroke: '#d62728', // Red for co-authorship
        strokeWidth: 1.2,
        strokeDasharray: '0' // Solid line
      };
    } else {
      return {
        stroke: '#999', // Gray for paper-author
        strokeWidth: 1,
        strokeDasharray: '0' // Solid line
      };
    }
  };

  // Main rendering of the network graph
  useEffect(() => {
    if (!networkData || !networkData.nodes || !networkData.links) return;

    const width = 800;
    const height = 600;

    // Clear previous graph
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    
    svg.selectAll('*').remove();

    // Add tooltip div if it doesn't exist
    let tooltip = d3.select(tooltipRef.current);
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div')
        .attr('class', 'network-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background-color', 'white')
        .style('border', '1px solid #ddd')
        .style('border-radius', '4px')
        .style('padding', '8px')
        .style('pointer-events', 'none')
        .style('font-size', '12px')
        .style('max-width', '200px')
        .style('z-index', 1000);
    }

    // Create a group for zoom/pan
    const g = svg.append('g');

    // Add zoom/pan behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);

    // Add a legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(20,20)');
    
    // Paper legend
    legend.append('circle')
      .attr('r', 6)
      .attr('fill', '#9370DB')
      .attr('cx', 10)
      .attr('cy', 10);
    
    legend.append('text')
      .attr('x', 20)
      .attr('y', 14)
      .text('Paper')
      .style('font-size', '12px');
    
    // Author legend
    legend.append('circle')
      .attr('r', 6)
      .attr('fill', '#FF7F50')
      .attr('cx', 10)
      .attr('cy', 30);
    
    legend.append('text')
      .attr('x', 20)
      .attr('y', 34)
      .text('Author')
      .style('font-size', '12px');
    
    // Paper-Author link
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 50)
      .attr('x2', 20)
      .attr('y2', 50)
      .attr('stroke', '#999')
      .attr('stroke-width', 1);
    
    legend.append('text')
      .attr('x', 25)
      .attr('y', 54)
      .text('Paper-Author')
      .style('font-size', '12px');
    
    // Co-author link
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 70)
      .attr('x2', 20)
      .attr('y2', 70)
      .attr('stroke', '#d62728')
      .attr('stroke-width', 1.2);
    
    legend.append('text')
      .attr('x', 25)
      .attr('y', 74)
      .text('Co-Author')
      .style('font-size', '12px');
    
    // Citation link
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 90)
      .attr('x2', 20)
      .attr('y2', 90)
      .attr('stroke', '#2ca02c')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,5');
    
    legend.append('text')
      .attr('x', 25)
      .attr('y', 94)
      .text('Citation')
      .style('font-size', '12px');

    // Add controls
    const controls = svg.append('g')
      .attr('class', 'controls')
      .attr('transform', `translate(${width - 150}, 20)`);
    
    // Layout buttons
    const layoutButtons = controls.append('g')
      .attr('class', 'layout-buttons');
    
    // Force layout button
    layoutButtons.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 80)
      .attr('height', 20)
      .attr('rx', 5)
      .attr('fill', layoutMode === 'force' ? '#9370DB' : '#ddd')
      .attr('cursor', 'pointer')
      .on('click', () => {
        setLayoutMode('force');
      });
    
    layoutButtons.append('text')
      .attr('x', 40)
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('fill', layoutMode === 'force' ? 'white' : 'black')
      .text('Force')
      .style('font-size', '12px')
      .style('pointer-events', 'none');
    
    // Radial layout button
    layoutButtons.append('rect')
      .attr('x', 0)
      .attr('y', 25)
      .attr('width', 80)
      .attr('height', 20)
      .attr('rx', 5)
      .attr('fill', layoutMode === 'radial' ? '#9370DB' : '#ddd')
      .attr('cursor', 'pointer')
      .on('click', () => {
        setLayoutMode('radial');
      });
    
    layoutButtons.append('text')
      .attr('x', 40)
      .attr('y', 39)
      .attr('text-anchor', 'middle')
      .attr('fill', layoutMode === 'radial' ? 'white' : 'black')
      .text('Radial')
      .style('font-size', '12px')
      .style('pointer-events', 'none');
    
    // Cluster layout button
    layoutButtons.append('rect')
      .attr('x', 0)
      .attr('y', 50)
      .attr('width', 80)
      .attr('height', 20)
      .attr('rx', 5)
      .attr('fill', layoutMode === 'cluster' ? '#9370DB' : '#ddd')
      .attr('cursor', 'pointer')
      .on('click', () => {
        setLayoutMode('cluster');
      });
    
    layoutButtons.append('text')
      .attr('x', 40)
      .attr('y', 64)
      .attr('text-anchor', 'middle')
      .attr('fill', layoutMode === 'cluster' ? 'white' : 'black')
      .text('Cluster')
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    // Create the simulation
    let simulation;
    
    if (layoutMode === 'force') {
      simulation = d3.forceSimulation(networkData.nodes)
        .force('link', d3.forceLink(networkData.links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => getNodeSize(d) * 1.5));
    } else if (layoutMode === 'radial') {
      // Remove the unused nodesByType variable
      simulation = d3.forceSimulation(networkData.nodes)
        .force('link', d3.forceLink(networkData.links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('r', d3.forceRadial(d => {
          if (d.type === 'paper') return 200;
          return 300;
        }, width / 2, height / 2).strength(0.8))
        .force('collision', d3.forceCollide().radius(d => getNodeSize(d) * 1.5));
    } else if (layoutMode === 'cluster') {
      // Group nodes by journal for papers or by paper count for authors
      simulation = d3.forceSimulation(networkData.nodes)
        .force('link', d3.forceLink(networkData.links).id(d => d.id).distance(70))
        .force('charge', d3.forceManyBody().strength(-100))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('x', d3.forceX().x(d => {
          if (d.type === 'paper') {
            // Cluster by year ranges
            const year = parseInt(d.year);
            if (isNaN(year)) return width * 0.5;
            if (year < 2000) return width * 0.2;
            if (year < 2010) return width * 0.4;
            if (year < 2020) return width * 0.6;
            return width * 0.8;
          }
          return width * 0.5;
        }).strength(0.1))
        .force('y', d3.forceY().y(d => {
          if (d.type === 'author') {
            return height * 0.2; // Authors at the top
          }
          return height * 0.6; // Papers at the bottom
        }).strength(0.1))
        .force('collision', d3.forceCollide().radius(d => getNodeSize(d) * 1.2));
    }

    // Create links with styling based on type
    const link = g.append('g')
      .selectAll('line')
      .data(networkData.links)
      .enter().append('line')
      .attr('stroke', d => getLinkStyle(d).stroke)
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => getLinkStyle(d).strokeWidth)
      .attr('stroke-dasharray', d => getLinkStyle(d).strokeDasharray);

    // Create node groups
    const node = g.append('g')
      .selectAll('g')
      .data(networkData.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('mouseover', (event, d) => {
        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        
        let tooltipContent = '';
        
        if (d.type === 'paper') {
          tooltipContent = `
            <strong>${d.id}</strong><br/>
            Year: ${d.year || 'Unknown'}<br/>
            Citations: ${d.citations}<br/>
            Journal: ${d.journal || 'Unknown'}<br/>
            Authors: ${d.authors || 'Unknown'}
          `;
        } else if (d.type === 'author') {
          tooltipContent = `
            <strong>${d.id}</strong><br/>
            Number of connections: ${d.connections}
          `;
        }
        
        tooltip.html(tooltipContent)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
        
        // Highlight connected nodes and links
        const connectedNodeIds = new Set();
        networkData.links.forEach(link => {
          if (link.source.id === d.id || link.target.id === d.id) {
            connectedNodeIds.add(link.source.id);
            connectedNodeIds.add(link.target.id);
          }
        });
        
        node.style('opacity', node => connectedNodeIds.has(node.id) ? 1 : 0.2);
        link.style('opacity', link => 
          link.source.id === d.id || link.target.id === d.id ? 1 : 0.05
        );
        
        // Highlight the current node
        d3.select(event.currentTarget).style('opacity', 1);
        
        setSelectedNode(d);
      })
      .on('mouseout', () => {
        // Hide tooltip
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
        
        // Reset highlight
        node.style('opacity', 1);
        link.style('opacity', 0.6);
        
        setSelectedNode(null);
      })
      .on('click', (event, d) => {
        // Handle node selection (could show detail panel, etc.)
        console.log('Selected node:', d);
      });

    // Add circles to nodes with dynamic sizing
    node.append('circle')
      .attr('r', d => getNodeSize(d))
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add labels to nodes with conditional display
    if (showLabels) {
      node.append('text')
        .attr('dx', d => getNodeSize(d) + 2)
        .attr('dy', '.35em')
        .text(d => d.id.length > 20 ? `${d.id.substring(0, 20)}...` : d.id)
        .style('font-size', '10px')
        .style('pointer-events', 'none');
    }

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
  }, [networkData, layoutMode, showLabels, highlightMode]);

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
      <div className="network-controls">
        <div className="control-group">
          <label>
            <input 
              type="checkbox" 
              checked={showLabels} 
              onChange={(e) => setShowLabels(e.target.checked)} 
            />
            Show Labels
          </label>
        </div>
        <div className="control-group">
          <select 
            value={highlightMode} 
            onChange={(e) => setHighlightMode(e.target.value)}
          >
            <option value="none">No Highlighting</option>
            <option value="citations">Highlight Citations</option>
            <option value="authors">Highlight Co-Authors</option>
          </select>
        </div>
      </div>
      <div ref={tooltipRef} className="network-tooltip"></div>
      <svg ref={svgRef}></svg>
      {selectedNode && (
        <div className="node-details-panel">
          <h3>{selectedNode.type === 'paper' ? 'Paper Details' : 'Author Details'}</h3>
          <h4>{selectedNode.id}</h4>
          {selectedNode.type === 'paper' && (
            <>
              <p><strong>Year:</strong> {selectedNode.year || 'Unknown'}</p>
              <p><strong>Citations:</strong> {selectedNode.citations}</p>
              <p><strong>Journal:</strong> {selectedNode.journal || 'Unknown'}</p>
              <p><strong>Authors:</strong> {selectedNode.authors || 'Unknown'}</p>
            </>
          )}
          {selectedNode.type === 'author' && (
            <p><strong>Connections:</strong> {selectedNode.connections}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;