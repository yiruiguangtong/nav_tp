export const floorDefinitions = [
  {
    id: 1,
    label: 'Floor 1',
    shortLabel: '1',
    url: 'glb/building/floor5.glb',
    objectName: 'Floor1',
    minY: -0.5,
    maxY: 1
  },
  {
    id: 2,
    label: 'Floor 2',
    shortLabel: '2',
    url: 'glb/building/floor4.glb',
    objectName: 'Floor2',
    minY: 1,
    maxY: 4
  },
  {
    id: 3,
    label: 'Floor 3',
    shortLabel: '3',
    url: 'glb/building/floor3.glb',
    objectName: 'Floor3',
    minY: 4,
    maxY: 6
  },
  {
    id: 4,
    label: 'Floor 4',
    shortLabel: '4',
    url: 'glb/building/floor2.glb',
    objectName: 'Floor4',
    minY: 6,
    maxY: 8
  },
  {
    id: 5,
    label: 'Floor 5',
    shortLabel: '5',
    url: 'glb/building/floor1.glb',
    objectName: 'Floor5',
    minY: 8,
    maxY: 12
  }
];

export const pointsOfInterest = [
  {
    id: 'entrance-a',
    label: 'Entrance A',
    category: 'Entrance',
    floor: 2,
    aliases: ['door 1', 'north door'],
    position: {
      x: -2.8050405761298927,
      y: 2.1136216852416756,
      z: -0.06086446907692
    }
  },
  {
    id: 'reception',
    label: 'Reception',
    category: 'Services',
    floor: 2,
    aliases: ['front desk', 'welcome desk', 'lobby'],
    position: {
      x: -1.45,
      y: 2.1136216852416756,
      z: -0.55
    }
  },
  {
    id: 'amphitheatre',
    label: 'Amphitheatre',
    category: 'Teaching',
    floor: 2,
    aliases: ['lecture hall', 'auditorium', 'amphi'],
    position: {
      x: 0.85,
      y: 2.1136216852416756,
      z: -1.8
    }
  },
  {
    id: 'entrance-b',
    label: 'Entrance B',
    category: 'Entrance',
    floor: 2,
    aliases: ['door 2', 'east door'],
    position: {
      x: 2.9064642030044134,
      y: 2.1136220260031022,
      z: -6.435141873951886
    }
  },
  {
    id: 'stairs-east-floor-2',
    label: 'East Stairs',
    category: 'Stairs',
    floor: 2,
    aliases: ['stairs', 'staircase', 'east stair'],
    position: {
      x: 2.35,
      y: 2.1136220260031022,
      z: -5.55
    }
  },
  {
    id: 'cafeteria',
    label: 'Cafeteria',
    category: 'Food',
    floor: 2,
    aliases: ['canteen', 'coffee', 'food', 'restaurant'],
    position: {
      x: -1.25,
      y: 2.1136216852416756,
      z: -4.7
    }
  },
  {
    id: 'ground-door',
    label: 'Ground Door',
    category: 'Entrance',
    floor: 1,
    aliases: ['door 3', 'ground floor door'],
    position: {
      x: 2.8842250480889082,
      y: 0.00648565998652928,
      z: -2.531122153463738
    }
  },
  {
    id: 'security-desk',
    label: 'Security Desk',
    category: 'Services',
    floor: 1,
    aliases: ['security', 'guard', 'help desk'],
    position: {
      x: 1.55,
      y: 0.25867900252342224,
      z: -2.1
    }
  },
  {
    id: 'bike-room',
    label: 'Bike Room',
    category: 'Services',
    floor: 1,
    aliases: ['bike parking', 'bicycle room', 'cycle parking'],
    position: {
      x: -1.1,
      y: 0.25867900252342224,
      z: -3.9
    }
  },
  {
    id: 'classroom-301',
    label: 'Classroom 301',
    category: 'Teaching',
    floor: 3,
    aliases: ['room 301', '301', 'class 301'],
    position: {
      x: -1.65,
      y: 4.258678436279297,
      z: -1.1
    }
  },
  {
    id: 'lab-3a',
    label: 'Lab 3A',
    category: 'Lab',
    floor: 3,
    aliases: ['laboratory 3a', 'research lab', 'lab'],
    position: {
      x: 1.65,
      y: 4.258678436279297,
      z: -4.9
    }
  },
  {
    id: 'restrooms-floor-3',
    label: 'Restrooms',
    category: 'Services',
    floor: 3,
    aliases: ['toilets', 'bathroom', 'wc'],
    position: {
      x: -2.2,
      y: 4.258678436279297,
      z: -5.65
    }
  },
  {
    id: 'library',
    label: 'Library',
    category: 'Study',
    floor: 4,
    aliases: ['study room', 'reading room', 'books'],
    position: {
      x: -1.85,
      y: 6.258678436279297,
      z: -1.3
    }
  },
  {
    id: 'meeting-room-410',
    label: 'Meeting Room 410',
    category: 'Meeting',
    floor: 4,
    aliases: ['room 410', '410', 'meeting room'],
    position: {
      x: 1.6,
      y: 6.258678436279297,
      z: -3.65
    }
  },
  {
    id: 'quiet-zone',
    label: 'Quiet Zone',
    category: 'Study',
    floor: 4,
    aliases: ['quiet study', 'silent area', 'study space'],
    position: {
      x: -0.2,
      y: 6.258678436279297,
      z: -5.75
    }
  },
  {
    id: 'admin-office',
    label: 'Administration',
    category: 'Office',
    floor: 5,
    aliases: ['admin', 'administrative office', 'office'],
    position: {
      x: -1.65,
      y: 8.258678436279297,
      z: -1.2
    }
  },
  {
    id: 'innovation-lab',
    label: 'Innovation Lab',
    category: 'Lab',
    floor: 5,
    aliases: ['project room', 'innovation', 'makerspace'],
    position: {
      x: 1.8,
      y: 8.258678436279297,
      z: -4.25
    }
  },
  {
    id: 'roof-access',
    label: 'Roof Access',
    category: 'Exit',
    floor: 5,
    aliases: ['roof', 'terrace', 'top exit'],
    position: {
      x: 0.5,
      y: 8.258678436279297,
      z: -6.0
    }
  }
];

export const feedbackOptions = [
  {
    id: 'clear',
    label: 'Clear'
  },
  {
    id: 'confusing',
    label: 'Confusing'
  },
  {
    id: 'blocked',
    label: 'Blocked'
  }
];
