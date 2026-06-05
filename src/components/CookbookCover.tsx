import React from 'react';
import { View } from 'react-native';
import { Dish } from './atoms';
import type { Recipe } from '../data/types';

/** Mosaic cover built from up to 4 recipe images. */
export function CookbookCover({
  recipes, h = 120,
}: { recipes: (Recipe | undefined)[]; h?: number }) {
  const imgs = recipes.filter(Boolean).slice(0, 4) as Recipe[];
  if (imgs.length >= 3) {
    return (
      <View style={{ flexDirection: 'row', height: h, gap: 2 }}>
        <Dish src={imgs[0].img} alt="" style={{ flex: 2, height: '100%' }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Dish src={imgs[1].img} alt="" style={{ flex: 1 }} />
          <Dish src={imgs[2].img} alt="" style={{ flex: 1 }} />
        </View>
      </View>
    );
  }
  return <Dish src={imgs[0]?.img} alt="" style={{ height: h }} />;
}
