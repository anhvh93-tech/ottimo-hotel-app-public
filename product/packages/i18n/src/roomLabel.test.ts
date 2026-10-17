import { describe, expect, it } from 'vitest';
import { compareRoomNo, roomLabel, roomMatches } from './roomLabel';

const pine = { roomNo: '401', name: 'The Pine', publicRoomType: 'Studio' };

describe('roomLabel (BR-012, DS 11.3)', () => {
  it('staff: "401 · The Pine"; no name yet → the number only', () => {
    expect(roomLabel(pine, 'staff')).toBe('401 · The Pine');
    expect(roomLabel({ roomNo: '401', name: null }, 'staff')).toBe('401');
    expect(roomLabel({ roomNo: '401', name: '  ' }, 'staff')).toBe('401');
    expect(roomLabel(null, 'staff')).toBe('');
  });

  it('guest: the name only, never the number', () => {
    expect(roomLabel(pine, 'guest')).toBe('The Pine');
    expect(roomLabel(pine, 'guest')).not.toContain('401');
  });

  it('guest, room not told yet → public room type (OTA group, BR-316/BR-429)', () => {
    expect(roomLabel(pine, 'guest', { disclosed: false })).toBe('Studio');
    expect(roomLabel({ roomNo: '401', name: 'The Pine' }, 'guest', { disclosed: false })).toBe('');
  });

  it('guest, no name entered yet → the caller’s fallback ("room 401"), else the number', () => {
    const fallback = (no: string) => `room ${no}`;
    expect(roomLabel({ roomNo: '401' }, 'guest', { fallback })).toBe('room 401');
    expect(roomLabel({ roomNo: '401' }, 'guest')).toBe('401');
  });

  it('a settled bill keeps its own name (the caller passes Bill.roomName)', () => {
    expect(roomLabel({ roomNo: '202', name: 'The Valley' }, 'guest')).toBe('The Valley');
  });
});

describe('roomMatches – "401", "pine", "The Pine" all find 401 · The Pine', () => {
  it.each(['401', '40', 'pine', 'Pine', 'PINE', 'The Pine', 'the pi', 'ine'])('%s', (q) =>
    expect(roomMatches(pine, q)).toBe(true),
  );
  it('does not match other rooms', () => {
    expect(roomMatches(pine, '402')).toBe(false);
    expect(roomMatches(pine, 'ember')).toBe(false);
    expect(roomMatches({ roomNo: '402', name: 'The Ember' }, 'the')).toBe(true);
  });
});

describe('compareRoomNo', () => {
  it('numeric order, unassigned last', () => {
    expect(['402', null, '101', '1001', '203'].sort(compareRoomNo)).toEqual([
      '101',
      '203',
      '402',
      '1001',
      null,
    ]);
  });
});
