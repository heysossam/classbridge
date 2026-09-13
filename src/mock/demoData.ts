import { Room, Activity, StudentMembership, StudentResponse, TeacherPrivateNote } from '../types';

export const initialRoom: Room = {
  id: 'room-kr-tw-01',
  title: 'Korea–Taiwan Culture Box Exchange',
  joinCode: 'BRIDGE2026',
  partnerALabel: 'Korea Class',
  partnerBLabel: 'Taiwan Class',
  partnerAStatus: 'in_progress',
  partnerBStatus: 'in_progress',
  partnerANextTask: 'Review Taiwan partner comments and vote for keyring',
  partnerBNextTask: 'Complete voting and submit reasons in English',
  overallProgress: 68,
  nextSchedule: '2026-09-18 (Culture Box Souvenir Packaging)',
  currentActivityTitle: 'Choose Your Favorite Keyring Design',
  lastUpdated: 'Today 10:30 AM'
};

export const initialActivity: Activity = {
  id: 'act-keyring-vote',
  roomId: 'room-kr-tw-01',
  title: 'Choose Your Favorite Keyring Design',
  instructions: 'Please select one keyring design that best symbolizes the friendship between Korea and Taiwan, and express your reason using sentence frames!',
  dueDate: '2026-09-16',
  options: [
    {
      id: 'Design A',
      title: 'Design A: Traditional Lantern & Knot',
      description: 'Features a Korean traditional silk knot paired with a Taiwanese red sky lantern illustration.',
      icon: '🏮'
    },
    {
      id: 'Design B',
      title: 'Design B: Friendly Mascots',
      description: 'Cute illustrations of Korea’s Magpie and Taiwan’s Formosan Black Bear high-fiving.',
      icon: '🐻'
    },
    {
      id: 'Design C',
      title: 'Design C: Landmarks & Nature',
      description: 'Minimalist skyline featuring N Seoul Tower, Taipei 101, and cherry blossoms with tea leaves.',
      icon: '🗼'
    }
  ],
  sentenceFrames: [
    {
      id: 'frame-1',
      frame: 'I like design ___ because ___.',
      example: 'I like design A because it beautifully combines our traditional symbols.'
    },
    {
      id: 'frame-2',
      frame: 'I would like to receive ___ because ___.',
      example: 'I would like to receive design B because the mascot animals are so adorable.'
    },
    {
      id: 'frame-3',
      frame: 'My suggestion is to ___ because ___.',
      example: 'My suggestion is to use design C because the landmarks represent our cities.'
    },
    {
      id: 'frame-4',
      frame: 'My question is ___ because ___.',
      example: 'My question is what colors Taiwanese friends like because we want to match.'
    }
  ],
  status: 'active'
};

export const initialStudents: StudentMembership[] = [
  // Korea Class Students
  { id: 'm-kr-01', roomId: 'room-kr-tw-01', participantCode: 'K7M4', englishNickname: 'Sunny', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-02', roomId: 'room-kr-tw-01', participantCode: 'K3P8', englishNickname: 'Leo', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-03', roomId: 'room-kr-tw-01', participantCode: 'K9W2', englishNickname: 'Mina', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-04', roomId: 'room-kr-tw-01', participantCode: 'K2R7', englishNickname: 'Owen', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-05', roomId: 'room-kr-tw-01', participantCode: 'K5L1', englishNickname: 'Chloe', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-06', roomId: 'room-kr-tw-01', participantCode: 'K8X9', englishNickname: 'David', partnerSide: 'Korea Class', createdAt: '2026-09-10' },

  // Taiwan Class Students
  { id: 'm-tw-01', roomId: 'room-kr-tw-01', participantCode: 'T9Q2', englishNickname: 'Ruby', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-02', roomId: 'room-kr-tw-01', participantCode: 'T4B6', englishNickname: 'Ethan', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-03', roomId: 'room-kr-tw-01', participantCode: 'T8Y3', englishNickname: 'Kai', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-04', roomId: 'room-kr-tw-01', participantCode: 'T1N5', englishNickname: 'Grace', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-05', roomId: 'room-kr-tw-01', participantCode: 'T6V8', englishNickname: 'Lucas', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-06', roomId: 'room-kr-tw-01', participantCode: 'T3Z4', englishNickname: 'Amber', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
];

export const initialResponses: StudentResponse[] = [
  {
    id: 'res-kr-01',
    roomId: 'room-kr-tw-01',
    activityId: 'act-keyring-vote',
    membershipId: 'm-kr-01',
    participantCode: 'K7M4',
    englishNickname: 'Sunny',
    partnerSide: 'Korea Class',
    selectedOption: 'Design A',
    sentenceFrame: 'I like design ___ because ___.',
    userReason: 'it harmonizes traditional colors of both countries with warm feeling.',
    fullStatement: 'I like design A because it harmonizes traditional colors of both countries with warm feeling.',
    submittedAt: '2026-09-12 14:20',
    visibilityStatus: 'public'
  },
  {
    id: 'res-kr-02',
    roomId: 'room-kr-tw-01',
    activityId: 'act-keyring-vote',
    membershipId: 'm-kr-02',
    participantCode: 'K3P8',
    englishNickname: 'Leo',
    partnerSide: 'Korea Class',
    selectedOption: 'Design B',
    sentenceFrame: 'I would like to receive ___ because ___.',
    userReason: 'the bear and bird mascots show genuine friendship.',
    fullStatement: 'I would like to receive Design B because the bear and bird mascots show genuine friendship.',
    submittedAt: '2026-09-12 15:05',
    visibilityStatus: 'public'
  },
  {
    id: 'res-kr-03',
    roomId: 'room-kr-tw-01',
    activityId: 'act-keyring-vote',
    membershipId: 'm-kr-03',
    participantCode: 'K9W2',
    englishNickname: 'Mina',
    partnerSide: 'Korea Class',
    selectedOption: 'Design C',
    sentenceFrame: 'My suggestion is to ___ because ___.',
    userReason: 'include little LED lights on Taipei 101 and Seoul Tower.',
    fullStatement: 'My suggestion is to include little LED lights on Taipei 101 and Seoul Tower.',
    submittedAt: '2026-09-12 16:10',
    visibilityStatus: 'public'
  },
  {
    id: 'res-tw-01',
    roomId: 'room-kr-tw-01',
    activityId: 'act-keyring-vote',
    membershipId: 'm-tw-01',
    participantCode: 'T9Q2',
    englishNickname: 'Ruby',
    partnerSide: 'Taiwan Class',
    selectedOption: 'Design A',
    sentenceFrame: 'I like design ___ because ___.',
    userReason: 'the sky lantern brings good wishes to our Korean friends.',
    fullStatement: 'I like design A because the sky lantern brings good wishes to our Korean friends.',
    submittedAt: '2026-09-12 11:30',
    visibilityStatus: 'public'
  },
  {
    id: 'res-tw-02',
    roomId: 'room-kr-tw-01',
    activityId: 'act-keyring-vote',
    membershipId: 'm-tw-02',
    participantCode: 'T4B6',
    englishNickname: 'Ethan',
    partnerSide: 'Taiwan Class',
    selectedOption: 'Design B',
    sentenceFrame: 'I like design ___ because ___.',
    userReason: 'Formosan black bear is our national pride and looks so friendly.',
    fullStatement: 'I like design B because Formosan black bear is our national pride and looks so friendly.',
    submittedAt: '2026-09-12 13:45',
    visibilityStatus: 'public'
  },
  {
    id: 'res-tw-03',
    roomId: 'room-kr-tw-01',
    activityId: 'act-keyring-vote',
    membershipId: 'm-tw-03',
    participantCode: 'T8Y3',
    englishNickname: 'Kai',
    partnerSide: 'Taiwan Class',
    selectedOption: 'Design A',
    sentenceFrame: 'I would like to receive ___ because ___.',
    userReason: 'traditional knots feel very precious and meaningful.',
    fullStatement: 'I would like to receive Design A because traditional knots feel very precious and meaningful.',
    submittedAt: '2026-09-12 14:00',
    visibilityStatus: 'public'
  },
  {
    id: 'res-tw-04',
    roomId: 'room-kr-tw-01',
    activityId: 'act-keyring-vote',
    membershipId: 'm-tw-04',
    participantCode: 'T1N5',
    englishNickname: 'Grace',
    partnerSide: 'Taiwan Class',
    selectedOption: 'Design C',
    sentenceFrame: 'My question is ___ because ___.',
    userReason: 'if Korean students have visited N Seoul Tower in autumn.',
    fullStatement: 'My question is if Korean students have visited N Seoul Tower in autumn.',
    submittedAt: '2026-09-12 15:30',
    visibilityStatus: 'public'
  }
];

export const initialTeacherNotes: Record<string, TeacherPrivateNote> = {
  'm-kr-01': {
    id: 'note-01',
    roomId: 'room-kr-tw-01',
    membershipId: 'm-kr-01',
    teacherId: 'teacher-kr-01',
    note: '양국 문화의 조화로움을 영어로 차분하게 잘 표현함. 모둠 활동에서도 배려심이 높음.',
    updatedAt: '2026-09-12 17:00'
  }
};
