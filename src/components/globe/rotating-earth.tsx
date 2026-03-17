'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { GeoPermissibleObjects } from 'd3';

interface RotatingEarthProps {
  className?: string;
}

export function RotatingEarth({ className }: RotatingEarthProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const width = svg.clientWidth || 800;
    const height = svg.clientHeight || 800;
    const sensitivity = 75;

    const projection = d3.geoOrthographic()
      .scale(width / 2.2)
      .center([0, 0])
      .rotate([-10, -30])
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const svgSel = d3.select(svg);
    svgSel.selectAll('*').remove();

    const globe = svgSel.append('circle')
      .attr('fill', '#000000')
      .attr('stroke', 'rgba(255, 255, 255, 0.15)')
      .attr('stroke-width', '0.5')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', projection.scale());

    svgSel.append('path')
      .datum(d3.geoGraticule10())
      .attr('d', path as any)
      .style('fill', 'none')
      .style('stroke', 'rgba(255, 255, 255, 0.06)')
      .style('stroke-width', '0.5')
      .attr('class', 'graticule');

    const defs = svgSel.append('defs');
    const pattern = defs.append('pattern')
      .attr('id', 'halftone')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 4)
      .attr('height', 4);
    pattern.append('circle')
      .attr('cx', 2)
      .attr('cy', 2)
      .attr('r', 0.7)
      .attr('fill', '#48484A');

    d3.json<any>('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((data) => {
      if (!data) return;

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3';
      script.onload = () => {
        const topo = (window as any).topojson;
        if (!topo) return;
        const land = topo.feature(data, data.objects.countries);

        svgSel.append('g')
          .selectAll('path')
          .data(land.features as GeoPermissibleObjects[])
          .enter().append('path')
          .attr('d', path as any)
          .style('fill', 'url(#halftone)')
          .style('stroke', 'rgba(255, 255, 255, 0.25)')
          .style('stroke-width', '0.5');

        setLoaded(true);
      };
      document.head.appendChild(script);
    });

    const dragBehavior = d3.drag<SVGSVGElement, unknown>()
      .on('drag', (event) => {
        const rotate = projection.rotate();
        const k = sensitivity / projection.scale();
        projection.rotate([rotate[0] + event.dx * k, rotate[1] - event.dy * k]);

        svgSel.selectAll('path').attr('d', path as any);
        globe
          .attr('cx', width / 2)
          .attr('cy', height / 2)
          .attr('r', projection.scale());
      });

    svgSel.call(dragBehavior);

    svgSel.on('wheel', (event: WheelEvent) => {
      event.preventDefault();
      const currentScale = projection.scale();
      const newScale = currentScale * (1 - event.deltaY * 0.001);
      const clampedScale = Math.max(width / 6, Math.min(width, newScale));
      projection.scale(clampedScale);

      svgSel.selectAll('path').attr('d', path as any);
      globe
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', clampedScale);
    }, { passive: false });

    let rotationTimer: ReturnType<typeof d3.timer> | null = null;
    rotationTimer = d3.timer(() => {
      const rotate = projection.rotate();
      projection.rotate([rotate[0] + 0.15, rotate[1]]);
      svgSel.selectAll('path').attr('d', path as any);
    });

    svgSel.on('mousedown', () => { rotationTimer?.stop(); });
    svgSel.on('mouseup', () => {
      rotationTimer = d3.timer(() => {
        const rotate = projection.rotate();
        projection.rotate([rotate[0] + 0.15, rotate[1]]);
        svgSel.selectAll('path').attr('d', path as any);
      });
    });

    return () => {
      rotationTimer?.stop();
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className={className}
      style={{ width: '100%', height: '100%', opacity: loaded ? 1 : 0, transition: 'opacity 0.8s ease' }}
    />
  );
}
