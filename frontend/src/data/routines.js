/** Default routines from Roberto_Fitness_Tracker_v2.xlsx Workout Templates */

export const DEFAULT_SCHEDULE = [
  'Rest',    // Sunday (0)
  'Push A',  // Monday
  'Pull A',  // Tuesday
  'Legs A',  // Wednesday
  'Push B',  // Thursday
  'Pull B',  // Friday
  'Legs B',  // Saturday
]

export const DEFAULT_START_DATE = '2026-06-01'

export const TRAINING_CYCLE = ['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B']

export const DEFAULT_ROUTINES = [
  {
    name: 'Push A',
    sortOrder: 0,
    exercises: [
      { name: 'Incline DB Press', targetSets: '3', repRange: '6-10', primaryMuscle: 'Upper chest', notes: 'Main lift. Controlled ROM.' },
      { name: 'Machine Press', targetSets: '3', repRange: '8-12', primaryMuscle: 'Chest', notes: 'Stable pressing volume.' },
      { name: 'Pec Deck / Cable Fly', targetSets: '2', repRange: '12-15', primaryMuscle: 'Chest', notes: 'Stretch + squeeze, no ego.' },
      { name: 'Lateral Raises', targetSets: '4', repRange: '12-20', primaryMuscle: 'Side delts', notes: 'Key visual muscle.' },
      { name: 'Seated Shoulder Press', targetSets: '2', repRange: '6-10', primaryMuscle: 'Front/mid delts', notes: 'Keep volume modest due to swimming.' },
      { name: 'Rope Pushdown', targetSets: '3', repRange: '10-15', primaryMuscle: 'Triceps', notes: 'Elbows stable.' },
      { name: 'OH Tricep Extension', targetSets: '2', repRange: '12-15', primaryMuscle: 'Triceps long head', notes: 'Full stretch.' },
    ],
  },
  {
    name: 'Pull A',
    sortOrder: 1,
    exercises: [
      { name: 'Pullup / Lat Pulldown', targetSets: '4', repRange: '6-10', primaryMuscle: 'Lats', notes: 'Vertical pull priority.' },
      { name: 'Single-Arm Pulldown', targetSets: '3', repRange: '8-12', primaryMuscle: 'Lats', notes: 'Drive elbow down.' },
      { name: 'Chest Supported Row', targetSets: '3', repRange: '8-12', primaryMuscle: 'Upper back', notes: 'Avoid lower-back fatigue.' },
      { name: 'Rear Delt Fly', targetSets: '3', repRange: '12-20', primaryMuscle: 'Rear delts', notes: 'Strict form.' },
      { name: 'Face Pull', targetSets: '2', repRange: '12-20', primaryMuscle: 'Rear delts/rotator cuff', notes: 'Shoulder health.' },
      { name: 'EZ Curl', targetSets: '3', repRange: '8-12', primaryMuscle: 'Biceps', notes: 'Controlled eccentric.' },
      { name: 'Incline Curl', targetSets: '2', repRange: '10-15', primaryMuscle: 'Biceps long head', notes: 'Stretch.' },
    ],
  },
  {
    name: 'Legs A',
    sortOrder: 2,
    exercises: [
      { name: 'Hack Squat', targetSets: '4', repRange: '6-10', primaryMuscle: 'Quads', notes: 'Primary quad builder.' },
      { name: 'Leg Press', targetSets: '3', repRange: '10-15', primaryMuscle: 'Quads', notes: 'Deep controlled reps.' },
      { name: 'Bulgarian Split Squat', targetSets: '3', repRange: '8-12', primaryMuscle: 'Quads/glutes', notes: 'Keep balance controlled.' },
      { name: 'Leg Extension', targetSets: '3', repRange: '12-20', primaryMuscle: 'Quads', notes: 'Hard squeeze.' },
      { name: 'Seated Calf Raise', targetSets: '4', repRange: '12-20', primaryMuscle: 'Calves', notes: 'Pause stretched position.' },
      { name: 'Abs', targetSets: '3', repRange: '10-20', primaryMuscle: 'Core', notes: 'Controlled.' },
    ],
  },
  {
    name: 'Push B',
    sortOrder: 3,
    exercises: [
      { name: 'Shoulder Press', targetSets: '3', repRange: '6-10', primaryMuscle: 'Delts', notes: 'Main shoulder press.' },
      { name: 'Machine Lateral Raise', targetSets: '4', repRange: '12-20', primaryMuscle: 'Side delts', notes: 'Priority movement.' },
      { name: 'Cable Lateral Raise', targetSets: '3', repRange: '12-20', primaryMuscle: 'Side delts', notes: 'Constant tension.' },
      { name: 'Incline Machine Press', targetSets: '3', repRange: '8-12', primaryMuscle: 'Upper chest', notes: 'Secondary chest.' },
      { name: 'Pec Deck', targetSets: '2', repRange: '12-15', primaryMuscle: 'Chest', notes: 'Controlled stretch.' },
      { name: 'Dips / Close Grip Press', targetSets: '2', repRange: '8-12', primaryMuscle: 'Triceps/chest', notes: 'Do not irritate shoulders.' },
      { name: 'Rope Pushdown', targetSets: '2', repRange: '10-15', primaryMuscle: 'Triceps', notes: 'Pump work.' },
    ],
  },
  {
    name: 'Pull B',
    sortOrder: 4,
    exercises: [
      { name: 'Chest Supported Row Heavy', targetSets: '4', repRange: '6-10', primaryMuscle: 'Upper back', notes: 'Thickness focus.' },
      { name: 'Cable Row', targetSets: '3', repRange: '8-12', primaryMuscle: 'Mid back', notes: 'Full scapular control.' },
      { name: 'Neutral Pulldown', targetSets: '3', repRange: '8-12', primaryMuscle: 'Lats', notes: 'Moderate.' },
      { name: 'Shrugs', targetSets: '4', repRange: '10-15', primaryMuscle: 'Traps', notes: 'Pause at top.' },
      { name: 'Rear Delt Fly', targetSets: '3', repRange: '12-20', primaryMuscle: 'Rear delts', notes: 'Strict.' },
      { name: 'Hammer Curl', targetSets: '3', repRange: '8-12', primaryMuscle: 'Brachialis/forearm', notes: 'Neutral grip.' },
      { name: 'Cable Curl', targetSets: '2', repRange: '12-15', primaryMuscle: 'Biceps', notes: 'Constant tension.' },
    ],
  },
  {
    name: 'Legs B',
    sortOrder: 5,
    exercises: [
      { name: 'Romanian Deadlift', targetSets: '3', repRange: '6-10', primaryMuscle: 'Hamstrings/glutes', notes: 'Keep back neutral.' },
      { name: 'Seated Leg Curl', targetSets: '4', repRange: '10-15', primaryMuscle: 'Hamstrings', notes: 'Full ROM.' },
      { name: 'Light Hack / Leg Press', targetSets: '3', repRange: '10-15', primaryMuscle: 'Quads', notes: 'Secondary quad volume.' },
      { name: 'Walking Lunges', targetSets: '2-3', repRange: '12 steps', primaryMuscle: 'Quads/glutes', notes: 'Controlled stride.' },
      { name: 'Standing Calf Raise', targetSets: '4', repRange: '12-20', primaryMuscle: 'Calves', notes: 'Full stretch.' },
      { name: 'Core', targetSets: '3', repRange: '10-20', primaryMuscle: 'Core', notes: 'Anti-extension or hanging raise.' },
    ],
  },
]

export const DEFAULT_SWIMMING = [
  {
    workoutDay: 'Push A',
    goal: 'Cardio without extra shoulder overload',
    minutes: '20-25',
    styleMix: 'More breaststroke than crawl',
    intensity: 'Easy/Moderate',
    structure: '5 min easy + 10-15 min 1 length crawl / 1 length breaststroke + 5 min easy',
    recoveryConcern: 'Shoulders/triceps',
  },
  {
    workoutDay: 'Pull A',
    goal: 'Solid cardio, controlled back fatigue',
    minutes: '25-30',
    styleMix: 'More crawl',
    intensity: 'Moderate',
    structure: '5 min easy + 15-20 min crawl steady + 5 min breaststroke easy',
    recoveryConcern: 'Lats/biceps',
  },
  {
    workoutDay: 'Legs A',
    goal: 'Recovery circulation after quads',
    minutes: '15-25',
    styleMix: 'Mixed slow',
    intensity: 'Very Easy/Easy',
    structure: 'Easy continuous swim; no hard kick',
    recoveryConcern: 'Quads',
  },
  {
    workoutDay: 'Push B',
    goal: 'Protect shoulders after delt focus',
    minutes: '15-20',
    styleMix: 'More breaststroke',
    intensity: 'Very Easy/Easy',
    structure: '5 min breaststroke + 5-10 min very easy crawl + 5 min breaststroke',
    recoveryConcern: 'Shoulders',
  },
  {
    workoutDay: 'Pull B',
    goal: 'Controlled cardio after back/traps',
    minutes: '25-30',
    styleMix: 'Mixed with crawl blocks',
    intensity: 'Moderate',
    structure: '5 min easy + 4-6x(2 min crawl + 1 min breaststroke easy) + 5 min easy',
    recoveryConcern: 'Upper back/traps',
  },
  {
    workoutDay: 'Legs B',
    goal: 'Recovery after posterior chain',
    minutes: '20-25',
    styleMix: 'Mixed easy',
    intensity: 'Easy',
    structure: '10 min breaststroke + 10 min crawl easy + optional 5 min easy',
    recoveryConcern: 'Hamstrings/glutes',
  },
  {
    workoutDay: 'Rest',
    goal: 'Recreational/technical only',
    minutes: '20-30',
    styleMix: 'Your choice',
    intensity: 'Very Easy',
    structure: 'Easy relaxed swim only, no performance goal',
    recoveryConcern: 'Overall recovery',
  },
]
