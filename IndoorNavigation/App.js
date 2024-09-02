import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

const gridLayout = {
  rows: 10,
  cols: 10,
  buildings: [
    { name: 'Building A', row: 1, col: 1, width: 3, height: 2 },
    { name: 'Building B', row: 4, col: 5, width: 2, height: 3 },
    { name: 'Building C', row: 7, col: 7, width: 3, height: 2 },
  ],
};

const GridMap = () => {
  const renderGrid = () => {
    const grid = [];
    for (let row = 0; row < gridLayout.rows; row++) {
      const cols = [];
      for (let col = 0; col < gridLayout.cols; col++) {
        const building = gridLayout.buildings.find(
          (b) =>
            row >= b.row &&
            row < b.row + b.height &&
            col >= b.col &&
            col < b.col + b.width
        );

        cols.push(
          <View
            key={`${row}-${col}`}
            style={[
              styles.cell,
              building && { backgroundColor: 'lightblue' },
            ]}
          >
            {building && row === building.row && col === building.col && (
              <Text style={styles.buildingName}>{building.name}</Text>
            )}
          </View>
        );
      }
      grid.push(
        <View key={row} style={styles.row}>
          {cols}
        </View>
      );
    }
    return grid;
  };

  return <View style={styles.container}>{renderGrid()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: 'gray',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buildingName: {
    fontSize: 10,
    textAlign: 'center',
  },
});

export default GridMap;
