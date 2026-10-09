import { fontFamily } from '@/theme/typography';
import { render } from '@testing-library/react-native';
import * as React from 'react';
import renderer from 'react-test-renderer';

import { ThemedText } from './ThemedText';

it(`renders correctly`, async () => {
  let tree: ReturnType<typeof renderer.create>;

  await React.act(async () => {
    tree = renderer.create(<ThemedText>Snapshot test!</ThemedText>);
  });

  expect(tree!.toJSON()).toMatchSnapshot();
});

describe('ThemedText typography', () => {
  it.each([
    ['default', fontFamily.sans, '400', 17],
    ['defaultSemiBold', fontFamily.sans, '500', 17],
    ['title', fontFamily.serif, '700', 33],
    ['subtitle', fontFamily.serif, '700', 21],
    ['link', fontFamily.sans, '400', 17],
  ] as const)(
    'sets %s in %s at weight %s and size %s',
    async (type, family, weight, size) => {
      const { getByText } = await render(
        <ThemedText type={type}>Sample</ThemedText>,
      );

      expect(getByText('Sample')).toHaveStyle({
        fontFamily: family,
        fontWeight: weight,
        fontSize: size,
      });
    },
  );
});
