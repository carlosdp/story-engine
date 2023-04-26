import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import moment from 'moment';
import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';

const islandSize = 2500;
const mapHeight = islandSize + 1000;
const mapWidth = islandSize + 1000;

function createGridElements(height: number, width: number, gridSize: number) {
  const rowCount = Math.ceil(height / gridSize);
  const colCount = Math.ceil(width / gridSize);
  const elements = [];

  for (let i = 1; i <= rowCount; i++) {
    elements.push(
      <line
        key={`horizontal-${i}`}
        x1={0}
        y1={i * gridSize}
        x2={width}
        y2={i * gridSize}
        stroke="black"
        strokeWidth={1}
      />
    );
  }

  for (let i = 1; i <= colCount; i++) {
    elements.push(
      <line
        key={`vertical-${i}`}
        x1={i * gridSize}
        y1={0}
        x2={i * gridSize}
        y2={height}
        stroke="black"
        strokeWidth={1}
      />
    );
  }

  for (let i = 0; i < rowCount; i++) {
    for (let j = 0; j < colCount; j++) {
      elements.push(
        <text key={`cell-${i}-${j}`} x={j * gridSize + 5} y={i * gridSize + 20} fontSize="20" fill="black">
          {`${String.fromCodePoint(65 + j)}${i}`}
        </text>
      );
    }
  }

  return elements;
}

function toMapLocation(location: unknown): [number, number] {
  const [x, y] = location as [number, number];

  return [mapHeight / 2 + y, mapWidth / 2 + x];
}

function GridLayer({ height, width, gridSize }: { height: number; width: number; gridSize: number }) {
  const map = useMap();
  const gridRef = useRef(null);

  // Calculate the top-left corner coordinates of the grid
  const topLeftX = (mapWidth - width) / 2;
  const topLeftY = (mapHeight - height) / 2;

  // Calculate the bottom-right corner coordinates of the grid
  const bottomRightX = topLeftX + width;
  const bottomRightY = topLeftY + height;

  useEffect(() => {
    if (gridRef.current) {
      const gridLayer = L.svgOverlay(gridRef.current, [
        [topLeftY, topLeftX],
        [bottomRightY, bottomRightX],
      ]);
      gridLayer.addTo(map);
      return () => {
        map.removeLayer(gridLayer);
      };
    }
  }, [map, topLeftX, topLeftY, bottomRightX, bottomRightY]);

  return (
    <svg ref={gridRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {createGridElements(height, width, gridSize)}
    </svg>
  );
}

const ImageOverlay = ({ imageUrl, bounds }: { imageUrl: string; bounds: L.LatLngBoundsExpression }) => {
  const map = useMap();
  useEffect(() => {
    const imageLayer = L.imageOverlay(imageUrl, bounds).addTo(map);
    return () => {
      map.removeLayer(imageLayer);
    };
  }, [imageUrl, bounds, map]);
  return null;
};

const imageUrl = '/map_2500_50500.png';
const bounds: L.LatLngBoundsLiteral = [
  [0, 0],
  [mapHeight, mapWidth],
];

export type RustMapProps = {
  observations?: { id: string; subsystem: string; text: string; location: unknown; created_at: string }[];
};

export const RustMap = ({ observations }: RustMapProps) => {
  const gridSize = 150;

  return (
    <MapContainer
      center={[mapHeight / 2, mapWidth / 2]} // Center the map on your image
      zoom={-1}
      maxZoom={3}
      minZoom={-2}
      style={{ width: '100%', flex: 1 }}
      maxBounds={bounds}
      crs={L.CRS.Simple}
    >
      <ImageOverlay imageUrl={imageUrl} bounds={bounds} />
      <GridLayer height={islandSize} width={islandSize} gridSize={gridSize} />
      {observations
        ?.filter(o => !!o.location)
        .map(observation => (
          <Marker key={observation.id} position={toMapLocation(observation.location)}>
            <Popup>
              <Flex flexDirection="column">
                <Box>
                  <Badge>{observation.subsystem}</Badge>
                </Box>
                <Text>{observation.text}</Text>
                <Text>{moment(observation.created_at).fromNow()}</Text>
              </Flex>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
};
