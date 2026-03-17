'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type { GeoPermissibleObjects } from 'd3';
import type { FeatureCollection, GeometryObject, GeoJsonProperties } from 'geojson';

interface RotatingEarthProps {
  className?: string;
}

export function RotatingEarth({ className }: RotatingEarthProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !dimensions) return;

    const { width, height } = dimensions;
    const sensitivity = 75;

    const projection = d3.geoOrthographic()
      .scale(Math.min(width, height) / 2.2)
      .center([0, 0])
      .rotate([-10, -30])
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const svgSel = d3.select(svg);
    svgSel.selectAll('*').remove();

    svgSel.attr('viewBox', `0 0 ${width} ${height}`);

    const globe = svgSel.append('circle')
      .attr('fill', '#000000')
      .attr('stroke', 'rgba(255, 255, 255, 0.15)')
      .attr('stroke-width', '0.5')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', projection.scale());

    svgSel.append('path')
      .datum(d3.geoGraticule10())
      .attr('d', (d) => path(d as GeoPermissibleObjects) ?? '')
      .style('fill', 'none')
      .style('stroke', 'rgba(255, 255, 255, 0.08)')
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
      .attr('fill', '#636366');

    d3.json<Topology>('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((data) => {
      if (!data) return;

      const land = topojson.feature(data, data.objects.countries) as FeatureCollection<GeometryObject, GeoJsonProperties>;

      svgSel.append('g')
        .selectAll('path')
        .data(land.features as GeoPermissibleObjects[])
        .enter().append('path')
        .attr('d', (d) => path(d as GeoPermissibleObjects) ?? '')
        .style('fill', 'url(#halftone)')
        .style('stroke', 'rgba(255, 255, 255, 0.3)')
        .style('stroke-width', '0.5');

      setLoaded(true);
    });

    const updatePaths = () => {
      svgSel.selectAll<SVGPathElement, GeoPermissibleObjects>('path').attr('d', (d) => path(d) ?? '');
      globe
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', projection.scale());
    };

    const dragBehavior = d3.drag<SVGSVGElement, unknown>()
      .on('start', () => {
        rotationTimer?.stop();
        rotationTimer = null;
      })
      .on('drag', (event) => {
        const rotate = projection.rotate();
        const k = sensitivity / projection.scale();
        projection.rotate([rotate[0] + event.dx * k, rotate[1] - event.dy * k]);
        updatePaths();
      })
      .on('end', () => {
        startAutoRotation();
      });

    svgSel.call(dragBehavior);

    svgSel.on('wheel', (event: WheelEvent) => {
      event.preventDefault();
      const currentScale = projection.scale();
      const newScale = currentScale * (1 - event.deltaY * 0.001);
      const minScale = Math.min(width, height) / 6;
      const maxScale = Math.min(width, height);
      const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
      projection.scale(clampedScale);
      updatePaths();
    }, { passive: false });

    let rotationTimer: ReturnType<typeof d3.timer> | null = null;

    const startAutoRotation = () => {
      rotationTimer?.stop();
      rotationTimer = d3.timer(() => {
        const rotate = projection.rotate();
        projection.rotate([rotate[0] + 0.15, rotate[1]]);
        updatePaths();
      });
    };

    startAutoRotation();

    return () => {
      rotationTimer?.stop();
    };
  }, [dimensions]);

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}
      />
    </div>
  );
}
