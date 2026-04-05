import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function TopologyGraph({ data, onSelectNode }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || !data?.nodes?.length) return;

    const width = svgEl.clientWidth || 800;
    const height = Math.max(280, Math.min(420, Math.floor(width * 0.58)));

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const root = svg.append("g");
    svg.call(d3.zoom().on("zoom", (event) => root.attr("transform", event.transform)));

    const simulation = d3
      .forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = root
      .append("g")
      .attr("stroke", "#24fcb7")
      .attr("stroke-opacity", 0.35)
      .selectAll("line")
      .data(data.links)
      .enter()
      .append("line")
      .attr("stroke-width", 1.5);

    const node = root
      .append("g")
      .selectAll("circle")
      .data(data.nodes)
      .enter()
      .append("circle")
      .attr("r", (d) => (d.type === "scanner" ? 12 : 9))
      .attr("fill", (d) => (d.vulnerable ? "#ff4d6d" : d.type === "scanner" ? "#24fcb7" : "#2dd4bf"))
      .style("cursor", "pointer")
      .on("click", (_, d) => onSelectNode?.(d));

    const labels = root
      .append("g")
      .selectAll("text")
      .data(data.nodes)
      .enter()
      .append("text")
      .text((d) => d.label)
      .attr("font-size", 11)
      .attr("fill", "#cbd5e1")
      .attr("dy", -12);

    node.call(
      d3
        .drag()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    return () => simulation.stop();
  }, [data, onSelectNode]);

  return <svg ref={svgRef} className="h-[300px] w-full rounded-xl border border-neon/30 bg-black/60 sm:h-[360px] lg:h-[420px]" />;
}
