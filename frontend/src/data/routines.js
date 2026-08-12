/** Default routines from Roberto_Fitness_Tracker_v2.xlsx Workout Templates,
 * adapted for the "Captain America" natural cut program (5 gym days/week,
 * shoulder-safe pressing, V-taper priority, RIR policy per exercise type). */

// 'Gym' is a generic marker (not a TRAINING_CYCLE name) so the app always advances
// to the next routine in the 6-workout cycle on every gym day. With 5 gym days/week
// and 6 routines (Push/Pull/Legs x2), a fixed weekday->routine-name mapping would
// never reach the 6th routine - this keeps the rotation honest across weeks.
export const DEFAULT_SCHEDULE = [
  'Rest',  // Sunday (0)
  'Gym',   // Monday
  'Gym',   // Tuesday
  'Gym',   // Wednesday
  'Gym',   // Thursday
  'Gym',   // Friday
  'Rest',  // Saturday
]

export const DEFAULT_START_DATE = '2026-06-01'

export const TRAINING_CYCLE = ['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B']

// RIR policy: pressing movements that directly load the shoulder stay at RIR 1-2
// (protecting the reported shoulder discomfort). Everything else can be pushed to
// RIR 0-1 on the last set with intensity techniques (drop set / myo-reps) since this
// is an intermediate lifter who knows how to train - caution is targeted, not blanket.
const SHOULDER_CAUTION = 'Presión directa al hombro: RIR 1-2, nunca al fallo.'
const PUSH_TO_LIMIT = 'Sin riesgo articular: última serie a RIR 0-1, dropset/myo-reps permitido.'

const SHOULDER_PREHAB = {
  name: 'Shoulder Prehab (band external rotation + face pull)',
  targetSets: '1',
  repRange: '15-20',
  primaryMuscle: 'Rotator cuff / rear delts',
  notes: 'Calentamiento obligatorio antes de prensar. No es serie de trabajo, peso ligero.',
  alternatives: [],
}

export const DEFAULT_ROUTINES = [
  {
    name: 'Push A',
    sortOrder: 0,
    exercises: [
      SHOULDER_PREHAB,
      { name: 'Incline DB Press', targetSets: '3', repRange: '6-10', primaryMuscle: 'Upper chest', notes: `Main lift, ROM controlado. ${SHOULDER_CAUTION}`, alternatives: ['Incline Barbell Press', 'Incline Machine Press', 'Incline Smith Machine Press'] },
      { name: 'Machine Press', targetSets: '3', repRange: '8-12', primaryMuscle: 'Chest', notes: `Volumen estable de empuje. ${SHOULDER_CAUTION}`, alternatives: ['Flat DB Press', 'Smith Machine Bench Press', 'Cable Chest Press'] },
      { name: 'Pec Deck / Cable Fly', targetSets: '2', repRange: '12-15', primaryMuscle: 'Chest', notes: `Estiramiento + contracción. ${PUSH_TO_LIMIT}`, alternatives: ['DB Fly', 'Single-Arm Cable Fly', 'Machine Fly'] },
      { name: 'Lateral Raises', targetSets: '4', repRange: '12-20', primaryMuscle: 'Side delts', notes: `Músculo clave para el V-taper. ${PUSH_TO_LIMIT}`, alternatives: ['Cable Lateral Raise', 'Machine Lateral Raise', 'DB Lateral Raise'] },
      { name: 'Seated Shoulder Press', targetSets: '2', repRange: '6-10', primaryMuscle: 'Front/mid delts', notes: `Volumen moderado a propósito. ${SHOULDER_CAUTION}`, alternatives: ['DB Shoulder Press', 'Machine Shoulder Press', 'Smith Machine Press'] },
      { name: 'Rope Pushdown', targetSets: '3', repRange: '10-15', primaryMuscle: 'Triceps', notes: `Codos estables. ${PUSH_TO_LIMIT}`, alternatives: ['Bar Pushdown', 'Single-Arm Cable Pushdown', 'DB Overhead Extension'] },
      { name: 'OH Tricep Extension', targetSets: '2', repRange: '12-15', primaryMuscle: 'Triceps long head', notes: `Estiramiento completo. ${PUSH_TO_LIMIT}`, alternatives: ['Cable Overhead Extension (rope)', 'Skull Crushers', 'Single-Arm DB Overhead Extension'] },
    ],
  },
  {
    name: 'Pull A',
    sortOrder: 1,
    exercises: [
      { name: 'Pullup / Lat Pulldown', targetSets: '4', repRange: '6-10', primaryMuscle: 'Lats', notes: `Prioridad jalón vertical. ${PUSH_TO_LIMIT}`, alternatives: ['Assisted Pullup Machine', 'Neutral-Grip Pulldown', 'Straight-Arm Pulldown'] },
      { name: 'Single-Arm Pulldown', targetSets: '3', repRange: '8-12', primaryMuscle: 'Lats', notes: `Codo hacia abajo. ${PUSH_TO_LIMIT}`, alternatives: ['Single-Arm Cable Row', 'Single-Arm Chest Supported Row'] },
      { name: 'Chest Supported Row', targetSets: '3', repRange: '8-12', primaryMuscle: 'Upper back', notes: `Evitar fatiga lumbar. ${PUSH_TO_LIMIT}`, alternatives: ['Seated Cable Row', 'T-Bar Row', 'DB Row'] },
      { name: 'Rear Delt Fly', targetSets: '3', repRange: '12-20', primaryMuscle: 'Rear delts', notes: `Forma estricta, ayuda al hombro. ${PUSH_TO_LIMIT}`, alternatives: ['Cable Rear Delt Fly', 'Reverse Pec Deck', 'Face Pull'] },
      { name: 'Face Pull', targetSets: '2', repRange: '12-20', primaryMuscle: 'Rear delts/rotator cuff', notes: `Salud del hombro. ${PUSH_TO_LIMIT}`, alternatives: ['Band Face Pull', 'Rear Delt Fly'] },
      { name: 'EZ Curl', targetSets: '3', repRange: '8-12', primaryMuscle: 'Biceps', notes: `Excéntrica controlada. ${PUSH_TO_LIMIT}`, alternatives: ['Barbell Curl', 'DB Curl', 'Cable Curl'] },
      { name: 'Incline Curl', targetSets: '2', repRange: '10-15', primaryMuscle: 'Biceps long head', notes: `Estiramiento. ${PUSH_TO_LIMIT}`, alternatives: ['Low-Pulley Cable Curl', 'Seated DB Curl'] },
    ],
  },
  {
    name: 'Legs A',
    sortOrder: 2,
    exercises: [
      // Leg Press first: same quad stimulus as Hack Squat without the shoulder
      // pad pressing directly on the shoulders. Hack Squat moved to alternative.
      { name: 'Leg Press', targetSets: '4', repRange: '6-10', primaryMuscle: 'Quads', notes: `Constructor principal de cuádriceps, sin carga en hombros. ${PUSH_TO_LIMIT}`, alternatives: ['Hack Squat (marca los hombros con el pad - usar solo si no hay otra opción)', 'Smith Machine Squat', 'Belt Squat', 'Pendulum Squat'] },
      { name: 'Bulgarian Split Squat', targetSets: '3', repRange: '8-12', primaryMuscle: 'Quads/glutes', notes: `Balance controlado. ${PUSH_TO_LIMIT}`, alternatives: ['Walking Lunges', 'Single-Leg Leg Press', 'Step-ups'] },
      { name: 'Leg Extension', targetSets: '3', repRange: '12-20', primaryMuscle: 'Quads', notes: `Contracción fuerte. ${PUSH_TO_LIMIT}`, alternatives: ['Sissy Squat', 'Single-Leg Leg Extension'] },
      { name: 'Seated Calf Raise', targetSets: '4', repRange: '12-20', primaryMuscle: 'Calves', notes: `Pausa en estiramiento. ${PUSH_TO_LIMIT}`, alternatives: ['Standing Calf Raise', 'Leg Press Calf Raise', 'Smith Machine Calf Raise'] },
      { name: 'Abs', targetSets: '3', repRange: '10-20', primaryMuscle: 'Core', notes: `Controlado. ${PUSH_TO_LIMIT}`, alternatives: ['Cable Crunch', 'Hanging Knee Raise', 'Ab Wheel'] },
    ],
  },
  {
    name: 'Push B',
    sortOrder: 3,
    exercises: [
      SHOULDER_PREHAB,
      { name: 'Shoulder Press', targetSets: '3', repRange: '6-10', primaryMuscle: 'Delts', notes: `Press principal de hombro. ${SHOULDER_CAUTION}`, alternatives: ['DB Shoulder Press', 'Machine Shoulder Press', 'Smith Machine Press'] },
      { name: 'Machine Lateral Raise', targetSets: '4', repRange: '12-20', primaryMuscle: 'Side delts', notes: `Movimiento prioritario para V-taper. ${PUSH_TO_LIMIT}`, alternatives: ['Cable Lateral Raise', 'DB Lateral Raise'] },
      { name: 'Cable Lateral Raise', targetSets: '3', repRange: '12-20', primaryMuscle: 'Side delts', notes: `Tensión constante. ${PUSH_TO_LIMIT}`, alternatives: ['Machine Lateral Raise', 'DB Lateral Raise'] },
      { name: 'Incline Machine Press', targetSets: '3', repRange: '8-12', primaryMuscle: 'Upper chest', notes: `Pecho secundario. ${SHOULDER_CAUTION}`, alternatives: ['Incline DB Press', 'Incline Smith Machine Press'] },
      { name: 'Pec Deck', targetSets: '2', repRange: '12-15', primaryMuscle: 'Chest', notes: `Estiramiento controlado. ${PUSH_TO_LIMIT}`, alternatives: ['Cable Fly', 'DB Fly'] },
      { name: 'Dips / Close Grip Press', targetSets: '2', repRange: '8-12', primaryMuscle: 'Triceps/chest', notes: `No irritar el hombro. ${SHOULDER_CAUTION}`, alternatives: ['Assisted Dip Machine', 'Cable Chest Press (close grip)', 'Smith Machine Close Grip Press'] },
      { name: 'Rope Pushdown', targetSets: '2', repRange: '10-15', primaryMuscle: 'Triceps', notes: `Trabajo de bombeo. ${PUSH_TO_LIMIT}`, alternatives: ['Bar Pushdown', 'Single-Arm Cable Pushdown'] },
    ],
  },
  {
    name: 'Pull B',
    sortOrder: 4,
    exercises: [
      { name: 'Chest Supported Row Heavy', targetSets: '4', repRange: '6-10', primaryMuscle: 'Upper back', notes: `Foco en grosor. ${PUSH_TO_LIMIT}`, alternatives: ['T-Bar Row', 'DB Row', 'Seated Cable Row'] },
      { name: 'Cable Row', targetSets: '3', repRange: '8-12', primaryMuscle: 'Mid back', notes: `Control escapular completo. ${PUSH_TO_LIMIT}`, alternatives: ['Chest Supported Row', 'Machine Row'] },
      { name: 'Neutral Pulldown', targetSets: '3', repRange: '8-12', primaryMuscle: 'Lats', notes: `Moderado. ${PUSH_TO_LIMIT}`, alternatives: ['Wide-Grip Lat Pulldown', 'Assisted Pullup Machine'] },
      { name: 'Shrugs', targetSets: '4', repRange: '10-15', primaryMuscle: 'Traps', notes: `Pausa arriba. ${PUSH_TO_LIMIT}`, alternatives: ['DB Shrugs', 'Smith Machine Shrugs', 'Cable Shrugs'] },
      { name: 'Rear Delt Fly', targetSets: '3', repRange: '12-20', primaryMuscle: 'Rear delts', notes: `Estricto. ${PUSH_TO_LIMIT}`, alternatives: ['Reverse Pec Deck', 'Cable Rear Delt Fly'] },
      { name: 'Hammer Curl', targetSets: '3', repRange: '8-12', primaryMuscle: 'Brachialis/forearm', notes: `Agarre neutro. ${PUSH_TO_LIMIT}`, alternatives: ['Cross-Body Hammer Curl', 'Rope Hammer Curl'] },
      { name: 'Cable Curl', targetSets: '2', repRange: '12-15', primaryMuscle: 'Biceps', notes: `Tensión constante. ${PUSH_TO_LIMIT}`, alternatives: ['DB Curl', 'EZ Bar Curl'] },
    ],
  },
  {
    name: 'Legs B',
    sortOrder: 5,
    exercises: [
      { name: 'Romanian Deadlift', targetSets: '3', repRange: '6-10', primaryMuscle: 'Hamstrings/glutes', notes: `Espalda neutra. ${PUSH_TO_LIMIT}`, alternatives: ['DB RDL', 'Cable RDL', 'Good Morning'] },
      { name: 'Seated Leg Curl', targetSets: '4', repRange: '10-15', primaryMuscle: 'Hamstrings', notes: `ROM completo. ${PUSH_TO_LIMIT}`, alternatives: ['Lying Leg Curl', 'Standing Single-Leg Curl'] },
      { name: 'Light Leg Press', targetSets: '3', repRange: '10-15', primaryMuscle: 'Quads', notes: `Volumen secundario de cuádriceps, sin carga en hombros. ${PUSH_TO_LIMIT}`, alternatives: ['Goblet Squat', 'Smith Machine Squat', 'Hack Squat (marca los hombros - último recurso)'] },
      { name: 'Walking Lunges', targetSets: '2-3', repRange: '12 steps', primaryMuscle: 'Quads/glutes', notes: `Zancada controlada. ${PUSH_TO_LIMIT}`, alternatives: ['Bulgarian Split Squat', 'Step-ups', 'Reverse Lunges'] },
      { name: 'Standing Calf Raise', targetSets: '4', repRange: '12-20', primaryMuscle: 'Calves', notes: `Estiramiento completo. ${PUSH_TO_LIMIT}`, alternatives: ['Seated Calf Raise', 'Leg Press Calf Raise'] },
      { name: 'Core', targetSets: '3', repRange: '10-20', primaryMuscle: 'Core', notes: `Anti-extensión o hanging raise. ${PUSH_TO_LIMIT}`, alternatives: ['Cable Crunch', 'Hanging Knee Raise', 'Plank variations'] },
    ],
  },
]

/** Morning habit, not a loggable gym routine: do on waking, before gym, ~5-10 min. */
export const MORNING_ABS_ROUTINE = {
  name: 'Morning Abs (habit, not gym time)',
  minutes: '5-10',
  exercises: [
    'Plank 3x30-45s',
    'Dead bug 3x10/lado',
    'Bicycle crunch 3x15/lado',
  ],
  notes: 'Sin equipo, al despertar, fuera del tiempo de gimnasio (45-60 min/día).',
}

/** Cardio in an air-conditioned gym, replacing outdoor pool swimming (no A/C = heat problem). */
export const DEFAULT_CARDIO = [
  {
    workoutDay: 'Push A',
    goal: 'Cardio ligero post-pesas, sin sobrecargar hombro/tríceps',
    minutes: '12-15',
    styleMix: 'Caminadora inclinada (12-15%), paso constante',
    intensity: 'Zona 2 (RPE 5-6)',
    structure: 'Al terminar las pesas: 12-15 min caminadora inclinada, ritmo conversacional',
    recoveryConcern: 'Hombros/tríceps',
  },
  {
    workoutDay: 'Pull A',
    goal: 'Cardio sin exigir más el agarre/dorsales',
    minutes: '15-20',
    styleMix: 'Bici estática, resistencia moderada',
    intensity: 'Zona 2 (RPE 5-6)',
    structure: '12-15 min bici a cadencia constante + 3 min enfriamiento',
    recoveryConcern: 'Dorsales/bíceps',
  },
  {
    workoutDay: 'Legs A',
    goal: 'Circulación/recuperación tras cuádriceps, bajo impacto',
    minutes: '10-15',
    styleMix: 'Elíptica suave o caminadora plana',
    intensity: 'Muy fácil (RPE 3-4)',
    structure: '10-15 min continuo, sin inclinación fuerte',
    recoveryConcern: 'Cuádriceps',
  },
  {
    workoutDay: 'Push B',
    goal: 'Proteger hombros tras trabajo de delts',
    minutes: '10-12',
    styleMix: 'Caminadora inclinada, ritmo suave',
    intensity: 'Fácil (RPE 4-5)',
    structure: '10-12 min caminadora, brazos relajados a los lados',
    recoveryConcern: 'Hombros',
  },
  {
    workoutDay: 'Pull B',
    goal: 'Cardio moderado tras espalda/trapecios',
    minutes: '15-20',
    styleMix: 'Bici o caminadora inclinada, alternando',
    intensity: 'Zona 2 (RPE 5-6)',
    structure: '15-20 min continuo, o 4x(3 min moderado + 1 min fácil)',
    recoveryConcern: 'Espalda alta/trapecios',
  },
  {
    workoutDay: 'Legs B',
    goal: 'Recuperación tras cadena posterior',
    minutes: '10-15',
    styleMix: 'Caminadora plana o elíptica muy suave',
    intensity: 'Muy fácil',
    structure: '10-15 min continuo, ritmo relajado',
    recoveryConcern: 'Isquiotibiales/glúteos',
  },
  {
    workoutDay: 'Rest',
    goal: 'Cardio opcional en día de descanso, sin obligación',
    minutes: '20-25',
    styleMix: 'Caminadora inclinada o bici, tu elección',
    intensity: 'Zona 2 (RPE 5-6)',
    structure: '20-25 min continuo si quieres sumar cardio extra; opcional, no obligatorio',
    recoveryConcern: 'Recuperación general',
  },
]

// Alias kept so existing imports (seed.js) keep working; the underlying
// `swimming_plans` table/schema is unchanged, only the content/labels moved to cardio.
export const DEFAULT_SWIMMING = DEFAULT_CARDIO
