import { describe, expect, it } from 'vitest';

import { cyclePane } from '../../src/tui/navigation';
import { SCREEN_PANE_CONFIG } from '../../src/tui/panes';

describe('pane-focus arrow navigation', () => {
  it('defines pane configuration for every screen', () => {
    const screens = Object.keys(SCREEN_PANE_CONFIG);
    expect(screens.sort()).toEqual(['config', 'copilot', 'dashboard', 'devices', 'incidents', 'setup', 'spaces', 'tickets'].sort());

    for (const [screenId, config] of Object.entries(SCREEN_PANE_CONFIG)) {
      expect(config.panes.length).toBeGreaterThan(0);
      expect(config.panes).toContain(config.defaultPane);
      expect(typeof screenId).toBe('string');
    }
  });

  it('cycles panes with left/right and wraps around', () => {
    const panes = ['a', 'b', 'c'];
    expect(cyclePane(panes, 'a', 'right')).toBe('b');
    expect(cyclePane(panes, 'c', 'right')).toBe('a');
    expect(cyclePane(panes, 'a', 'left')).toBe('c');
    expect(cyclePane(panes, 'b', 'left')).toBe('a');
  });
});

