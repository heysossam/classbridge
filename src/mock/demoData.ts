import { Room, Activity, StudentMembership, Submission, Comment, TeacherPrivateNote } from '../types';

export const ROOM_CODE = 'BRIDGE2026';

export const TEACHER_CODES = {
  KOREA: 'K-TEACH-2026',
  TAIWAN: 'T-TEACH-2026',
  ADMIN: 'ADMIN-BRIDGE-2026'
};

export const initialRoom: Room = {
  id: 'room-kr-tw-01',
  title: 'Korea–Taiwan Culture Box Exchange',
  joinCode: ROOM_CODE,
  partnerALabel: 'Korea Class',
  partnerBLabel: 'Taiwan Class',
  partnerAStatus: 'in_progress',
  partnerBStatus: 'in_progress',
  partnerANextTask: 'Check Taiwan responses on Food Poll and write comments',
  partnerBNextTask: 'Complete Ask Our Partner Class questions and answers',
  overallProgress: 65,
  nextSchedule: '2026-09-20 (Joint Project Wrap-up & Gift Unboxing)',
  lastUpdated: 'Today 11:30 AM'
};

// 34 Whitelisted Students (17 Korea, 17 Taiwan)
export const initialStudents: StudentMembership[] = [
  // Korea Class (17)
  { id: 'm-kr-01', roomId: 'room-kr-tw-01', englishNickname: 'Sunny', participantCode: 'K7M4', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-02', roomId: 'room-kr-tw-01', englishNickname: 'Leo', participantCode: 'K2R7', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-03', roomId: 'room-kr-tw-01', englishNickname: 'Mina', participantCode: 'K8X9', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-04', roomId: 'room-kr-tw-01', englishNickname: 'Owen', participantCode: 'K4P6', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-05', roomId: 'room-kr-tw-01', englishNickname: 'Chloe', participantCode: 'K5L1', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-06', roomId: 'room-kr-tw-01', englishNickname: 'Ethan', participantCode: 'K9B3', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-07', roomId: 'room-kr-tw-01', englishNickname: 'Yuna', participantCode: 'K3H8', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-08', roomId: 'room-kr-tw-01', englishNickname: 'Jay', participantCode: 'K6T2', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-09', roomId: 'room-kr-tw-01', englishNickname: 'Amy', participantCode: 'K1V5', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-10', roomId: 'room-kr-tw-01', englishNickname: 'Noah', participantCode: 'K8D4', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-11', roomId: 'room-kr-tw-01', englishNickname: 'Ella', participantCode: 'K2W9', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-12', roomId: 'room-kr-tw-01', englishNickname: 'Ian', participantCode: 'K7F3', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-13', roomId: 'room-kr-tw-01', englishNickname: 'Lily', participantCode: 'K5Q8', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-14', roomId: 'room-kr-tw-01', englishNickname: 'Max', participantCode: 'K9N2', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-15', roomId: 'room-kr-tw-01', englishNickname: 'Ruby', participantCode: 'K4C7', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-16', roomId: 'room-kr-tw-01', englishNickname: 'Evan', participantCode: 'K6J1', partnerSide: 'Korea Class', createdAt: '2026-09-10' },
  { id: 'm-kr-17', roomId: 'room-kr-tw-01', englishNickname: 'Zoe', participantCode: 'K3S5', partnerSide: 'Korea Class', createdAt: '2026-09-10' },

  // Taiwan Class (17)
  { id: 'm-tw-01', roomId: 'room-kr-tw-01', englishNickname: 'Alice', participantCode: 'T7A4', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-02', roomId: 'room-kr-tw-01', englishNickname: 'Kevin', participantCode: 'T2K8', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-03', roomId: 'room-kr-tw-01', englishNickname: 'Emily', participantCode: 'T9E3', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-04', roomId: 'room-kr-tw-01', englishNickname: 'Ryan', participantCode: 'T4R6', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-05', roomId: 'room-kr-tw-01', englishNickname: 'Bella', participantCode: 'T6B2', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-06', roomId: 'room-kr-tw-01', englishNickname: 'Daniel', participantCode: 'T8D5', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-07', roomId: 'room-kr-tw-01', englishNickname: 'Cindy', participantCode: 'T3C9', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-08', roomId: 'room-kr-tw-01', englishNickname: 'Jason', participantCode: 'T5J1', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-09', roomId: 'room-kr-tw-01', englishNickname: 'Grace', participantCode: 'T1G7', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-10', roomId: 'room-kr-tw-01', englishNickname: 'Eric', participantCode: 'T9E6', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-11', roomId: 'room-kr-tw-01', englishNickname: 'Vivian', participantCode: 'T4V2', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-12', roomId: 'room-kr-tw-01', englishNickname: 'Lucas', participantCode: 'T7L8', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-13', roomId: 'room-kr-tw-01', englishNickname: 'Sophie', participantCode: 'T2S4', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-14', roomId: 'room-kr-tw-01', englishNickname: 'Andy', participantCode: 'T6A9', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-15', roomId: 'room-kr-tw-01', englishNickname: 'Irene', participantCode: 'T8I3', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-16', roomId: 'room-kr-tw-01', englishNickname: 'Tony', participantCode: 'T3T5', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
  { id: 'm-tw-17', roomId: 'room-kr-tw-01', englishNickname: 'Mia', participantCode: 'T5M7', partnerSide: 'Taiwan Class', createdAt: '2026-09-10' },
];

// 6 Core Example Activities (Section G)
export const initialActivities: Activity[] = [
  // 1. Hello, My New Friend!
  {
    id: 'act-01',
    roomId: 'room-kr-tw-01',
    title: 'Hello, My New Friend!',
    type: 'writing',
    instructionsKo: '영어 이름, 좋아하는 것, 좋아하는 교과와 상대국 친구에게 궁금한 점을 소개하세요.',
    instructionsEn: 'Introduce your English name, hobbies, favorite school subjects, and ask a warm question to your partner friend.',
    instructionsZh: '請介紹您的英文名字、興趣嗜好、最喜歡的科目，並向夥伴班級的朋友提出一個溫暖的好奇提問。',
    startDate: '2026-09-01',
    dueDate: '2026-09-10',
    isRequired: true,
    targetSide: 'Both',
    status: 'closed',
    sentenceFrames: [
      { id: 'sf-1-1', frame: 'Hello! My name is ___.', example: 'Hello! My name is Sunny.' },
      { id: 'sf-1-2', frame: 'I enjoy ___ in my free time.', example: 'I enjoy drawing cartoons in my free time.' },
      { id: 'sf-1-3', frame: 'My favorite subject is ___ because ___.', example: 'My favorite subject is Science because I love experiments.' },
      { id: 'sf-1-4', frame: 'I am curious about ___ in your school.', example: 'I am curious about lunch menus in your school.' }
    ],
    submissionLimit: 1,
    minWordCount: 15,
    maxWordCount: 150,
    allowEdit: true,
    allowComments: true,
    allowLikes: true,
    allowPartnerResponse: true,
    requireApproval: false,
    viewAfterSubmit: true,
    visibility: 'both_classes',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01'
  },

  // 2. A Place I Want to Show You
  {
    id: 'act-02',
    roomId: 'room-kr-tw-01',
    title: 'A Place I Want to Show You',
    type: 'writing',
    instructionsKo: '자신의 나라에서 상대국 친구에게 꼭 소개하고 싶은 관광지 또는 전통 문화를 소개합니다.',
    instructionsEn: 'Introduce an attractive landmark, scenic spot, or traditional culture of your home country to your exchange partner.',
    instructionsZh: '向跨國夥伴介紹您最想推薦的景點、私房名勝或獨具特色的傳統文化。',
    startDate: '2026-09-05',
    dueDate: '2026-09-15',
    isRequired: true,
    targetSide: 'Both',
    status: 'published',
    sentenceFrames: [
      { id: 'sf-2-1', frame: 'I want to show you ___ in my country.', example: 'I want to show you Gyeongbokgung Palace in my country.' },
      { id: 'sf-2-2', frame: 'This place is famous for ___.', example: 'This place is famous for royal hanbok experiences and beautiful autumn trees.' },
      { id: 'sf-2-3', frame: 'If you visit here, you can ___.', example: 'If you visit here, you can take memorable pictures with friends.' }
    ],
    submissionLimit: 2,
    minWordCount: 20,
    maxWordCount: 200,
    allowEdit: true,
    allowComments: true,
    allowLikes: true,
    allowPartnerResponse: true,
    requireApproval: false,
    viewAfterSubmit: true,
    visibility: 'both_classes',
    createdAt: '2026-09-05',
    updatedAt: '2026-09-05'
  },

  // 3. Ask Our Partner Class
  {
    id: 'act-03',
    roomId: 'room-kr-tw-01',
    title: 'Ask Our Partner Class',
    type: 'qa',
    instructionsKo: '상대국 학생에게 학교생활, 음식, 명절, 놀이와 관광지에 관해 자유롭게 질문하고 답합니다.',
    instructionsEn: 'Ask curious questions about school life, snacks, holidays, games, and culture, and reply to questions asked by your partner classmates!',
    instructionsZh: '向夥伴班級提出關於學校生活、零食點心、節慶活動或景點的好奇提問，並熱情回答對方的問題！',
    startDate: '2026-09-08',
    dueDate: '2026-09-18',
    isRequired: true,
    targetSide: 'Both',
    status: 'published',
    sentenceFrames: [
      { id: 'sf-3-1', frame: 'What is your favorite ___?', example: 'What is your favorite Taiwanese street dessert?' },
      { id: 'sf-3-2', frame: 'How do you celebrate ___?', example: 'How do you celebrate Mid-Autumn Festival in Taiwan?' },
      { id: 'sf-3-3', frame: 'In our school, we usually ___. How about you?', example: 'In our school, we usually have cleaning time after lunch. How about you?' }
    ],
    submissionLimit: 3,
    minWordCount: 5,
    maxWordCount: 120,
    allowEdit: true,
    allowComments: true,
    allowLikes: true,
    allowPartnerResponse: true,
    requireApproval: false,
    viewAfterSubmit: false,
    visibility: 'both_classes',
    qaConfig: {
      maxQuestionsPerStudent: 3,
      questionMaxWords: 60,
      answerMaxWords: 150,
      respondentScope: 'partner_only', // Only partner students can reply
      minAnswersPerStudent: 1,
      allowAnswerEdit: true
    },
    createdAt: '2026-09-08',
    updatedAt: '2026-09-08'
  },

  // 4. What Food Would You Like to Try?
  {
    id: 'act-04',
    roomId: 'room-kr-tw-01',
    title: 'What Food Would You Like to Try?',
    type: 'poll',
    instructionsKo: '상대국의 대표 음식 중 가장 맛보고 싶은 음식을 투표하고, 영어 문장 틀을 활용해 이유를 작성하세요.',
    instructionsEn: 'Vote for the partner country dish you are most eager to try, and express your reason in English using the sentence frames!',
    instructionsZh: '票選最想品嚐的跨國美食，並運用英文句型框架寫下吸引您的原因！',
    startDate: '2026-09-10',
    dueDate: '2026-09-16',
    isRequired: false,
    targetSide: 'Both',
    status: 'published',
    sentenceFrames: [
      { id: 'sf-4-1', frame: 'I would like to try ___.', example: 'I would like to try Bubble Tea.' },
      { id: 'sf-4-2', frame: 'I chose it because ___.', example: 'I chose it because chewy pearls look delicious.' },
      { id: 'sf-4-3', frame: 'It looks ___.', example: 'It looks refreshing and sweet.' },
      { id: 'sf-4-4', frame: 'I wonder if it is ___.', example: 'I wonder if it is too sweet for kids.' }
    ],
    submissionLimit: 1,
    minWordCount: 10,
    maxWordCount: 150,
    allowEdit: true,
    allowComments: true,
    allowLikes: true,
    allowPartnerResponse: true,
    requireApproval: false,
    viewAfterSubmit: true,
    visibility: 'both_classes',
    pollConfig: {
      options: [
        // Taiwan Class options (Korean food they want to try)
        { id: 'opt-kr-1', text: 'Tteokbokki (Spicy Rice Cakes)', targetSide: 'Taiwan Class' },
        { id: 'opt-kr-2', text: 'Gimbap (Seaweed Rice Rolls)', targetSide: 'Taiwan Class' },
        { id: 'opt-kr-3', text: 'Bulgogi (Marinated Beef)', targetSide: 'Taiwan Class' },
        { id: 'opt-kr-4', text: 'Hotteok (Sweet Pancakes)', targetSide: 'Taiwan Class' },
        { id: 'opt-kr-5', text: 'Bingsu (Shaved Ice Dessert)', targetSide: 'Taiwan Class' },

        // Korea Class options (Taiwanese food they want to try)
        { id: 'opt-tw-1', text: 'Beef Noodle Soup (Niu Rou Mian)', targetSide: 'Korea Class' },
        { id: 'opt-tw-2', text: 'Lu Rou Fan (Braised Pork Rice)', targetSide: 'Korea Class' },
        { id: 'opt-tw-3', text: 'Bubble Tea (Boba Milk Tea)', targetSide: 'Korea Class' },
        { id: 'opt-tw-4', text: 'Mango Shaved Ice', targetSide: 'Korea Class' },
        { id: 'opt-tw-5', text: 'Pineapple Cake (Feng Li Su)', targetSide: 'Korea Class' },
      ],
      allowMultipleChoices: false,
      requireReason: true,
      resultsVisibility: 'immediate',
      allowVoteChange: true
    },
    createdAt: '2026-09-10',
    updatedAt: '2026-09-10'
  },

  // 5. If You Had One Day in Seoul or Taiwan
  {
    id: 'act-05',
    roomId: 'room-kr-tw-01',
    title: 'If You Had One Day in Seoul or Taiwan',
    type: 'writing',
    instructionsKo: '상대국을 하루 여행한다면 하고 싶은 활동과 여행 계획을 작성하고, 상대국 학생은 추천 댓글을 남깁니다.',
    instructionsEn: 'Plan your dream 1-day travel itinerary in your partner city! Partner students will leave helpful tips and recommendations in comments.',
    instructionsZh: '規劃在首爾或臺灣的一日夢幻旅行行程！夥伴班級同學將在留言區為您提供在地貼心建議。',
    startDate: '2026-09-12',
    dueDate: '2026-09-22',
    isRequired: true,
    targetSide: 'Both',
    status: 'published',
    sentenceFrames: [
      { id: 'sf-5-1', frame: 'If I visit ___, I want to ___.', example: 'If I visit Taipei, I want to ride the Maokong Gondola.' },
      { id: 'sf-5-2', frame: 'First, I will ___.', example: 'First, I will visit Taipei 101 to see the panoramic skyline.' },
      { id: 'sf-5-3', frame: 'Next, I will ___.', example: 'Next, I will explore Shilin Night Market for tasty night snacks.' },
      { id: 'sf-5-4', frame: 'I chose this because ___.', example: 'I chose this because I want to experience night market culture with friends.' }
    ],
    submissionLimit: 1,
    minWordCount: 25,
    maxWordCount: 250,
    allowEdit: true,
    allowComments: true,
    allowLikes: true,
    allowPartnerResponse: true,
    requireApproval: false,
    viewAfterSubmit: true,
    visibility: 'both_classes',
    createdAt: '2026-09-12',
    updatedAt: '2026-09-12'
  },

  // 6. What We Learned Together
  {
    id: 'act-06',
    roomId: 'room-kr-tw-01',
    title: 'What We Learned Together',
    type: 'writing',
    instructionsKo: '공동수업을 통해 새롭게 알게 된 점, 양국의 공통점과 차이점, 상대국 친구에게 전하고 싶은 말을 성찰하여 작성합니다.',
    instructionsEn: 'Reflect on what you learned: cultural commonalities, interesting differences, and a sincere message to your partner friends.',
    instructionsZh: '反思在此次跨國共同教學中學到的收穫：文化的相通之處與獨特差異，以及想對夥伴好友說的祝福！',
    startDate: '2026-09-16',
    dueDate: '2026-09-25',
    isRequired: true,
    targetSide: 'Both',
    status: 'draft',
    sentenceFrames: [
      { id: 'sf-6-1', frame: 'Through this project, I learned that ___.', example: 'Through this project, I learned that Taiwanese students also love K-pop and delicious food.' },
      { id: 'sf-6-2', frame: 'One interesting difference is ___.', example: 'One interesting difference is traditional holiday customs and night market culture.' },
      { id: 'sf-6-3', frame: 'To my partner friend, I want to say ___.', example: 'To my partner friend, I want to say thank you for sharing your warm culture!' }
    ],
    submissionLimit: 1,
    minWordCount: 20,
    maxWordCount: 200,
    allowEdit: true,
    allowComments: true,
    allowLikes: true,
    allowPartnerResponse: true,
    requireApproval: false,
    viewAfterSubmit: true,
    visibility: 'both_classes',
    createdAt: '2026-09-12',
    updatedAt: '2026-09-12'
  }
];

// Initial Rich Submissions
export const initialSubmissions: Submission[] = [
  // Sunny (Korea) - Act 1: Hello
  {
    id: 'sub-01',
    activityId: 'act-01',
    membershipId: 'm-kr-01',
    participantCode: 'K7M4',
    englishNickname: 'Sunny',
    partnerSide: 'Korea Class',
    type: 'writing',
    title: 'Hello from Sunny in Seoul!',
    content: 'Hello! My name is Sunny. I enjoy drawing cartoons in my free time. My favorite subject is Science because I love experiments. I am curious about what sports Taiwanese students like the most during P.E. class!',
    language: 'en',
    submittedAt: '2026-09-03 10:15',
    isApproved: true,
    isHidden: false,
    likesCount: 3,
    likedBy: ['T7A4', 'T9E3', 'K2R7']
  },

  // Alice (Taiwan) - Act 1: Hello
  {
    id: 'sub-02',
    activityId: 'act-01',
    membershipId: 'm-tw-01',
    participantCode: 'T7A4',
    englishNickname: 'Alice',
    partnerSide: 'Taiwan Class',
    type: 'writing',
    title: 'Greetings from Alice in Taipei!',
    content: 'Hello Sunny and Korean friends! My name is Alice. I love playing badminton and drinking bubble tea after school. In Taiwan, dodgeball and basketball are very popular in P.E. class! Nice to meet you all.',
    language: 'en',
    submittedAt: '2026-09-04 14:20',
    isApproved: true,
    isHidden: false,
    likesCount: 4,
    likedBy: ['K7M4', 'K8X9', 'T2K8', 'T4R6']
  },

  // Sunny (Korea) - Act 2: A Place I Want to Show You
  {
    id: 'sub-03',
    activityId: 'act-02',
    membershipId: 'm-kr-01',
    participantCode: 'K7M4',
    englishNickname: 'Sunny',
    partnerSide: 'Korea Class',
    type: 'writing',
    title: 'Bukchon Hanok Village in Seoul',
    content: 'I want to show you Bukchon Hanok Village in Seoul. This place is famous for traditional Korean houses and cozy tea houses. If you visit here, you can wear beautiful Hanbok and feel like you traveled back in Joseon Dynasty!',
    language: 'en',
    submittedAt: '2026-09-08 11:30',
    isApproved: true,
    isHidden: false,
    likesCount: 2,
    likedBy: ['T7A4', 'T4R6']
  },

  // Kevin (Taiwan) - Act 2: A Place I Want to Show You
  {
    id: 'sub-04',
    activityId: 'act-02',
    membershipId: 'm-tw-02',
    participantCode: 'T2K8',
    englishNickname: 'Kevin',
    partnerSide: 'Taiwan Class',
    type: 'writing',
    title: 'Jiufen Old Street and Teahouses',
    content: 'I want to show you Jiufen in Taiwan. It is perched on mountain slopes facing the Pacific Ocean. It is famous for red lanterns, taro ball desserts, and looking like the movie Spirited Away! You will love the night view.',
    language: 'en',
    submittedAt: '2026-09-09 16:45',
    isApproved: true,
    isHidden: false,
    likesCount: 3,
    likedBy: ['K7M4', 'K2R7', 'T9E3']
  },

  // Leo (Korea) - Act 3: QA Question
  {
    id: 'sub-05',
    activityId: 'act-03',
    membershipId: 'm-kr-02',
    participantCode: 'K2R7',
    englishNickname: 'Leo',
    partnerSide: 'Korea Class',
    type: 'qa_question',
    content: 'What is the most popular street dessert that Taiwanese elementary students buy on the way home?',
    language: 'en',
    submittedAt: '2026-09-10 13:10',
    isApproved: true,
    isHidden: false,
    likesCount: 2,
    likedBy: ['T7A4', 'T9E3']
  },

  // Emily (Taiwan) - Act 3: QA Answer to Leo's question
  {
    id: 'sub-06',
    activityId: 'act-03',
    membershipId: 'm-tw-03',
    participantCode: 'T9E3',
    englishNickname: 'Emily',
    partnerSide: 'Taiwan Class',
    type: 'qa_answer',
    parentQuestionId: 'sub-05',
    content: 'Hi Leo! Most students buy fresh wheel cakes (custard or red bean flavor) and cold milk tea near school gates! They cost around 15 NT dollars and smell amazing.',
    language: 'en',
    submittedAt: '2026-09-10 15:30',
    isApproved: true,
    isHidden: false,
    likesCount: 3,
    likedBy: ['K2R7', 'K7M4', 'T7A4']
  },

  // Sunny (Korea) - Act 4: Food Poll
  {
    id: 'sub-07',
    activityId: 'act-04',
    membershipId: 'm-kr-01',
    participantCode: 'K7M4',
    englishNickname: 'Sunny',
    partnerSide: 'Korea Class',
    type: 'poll',
    selectedOptions: ['opt-tw-3'], // Bubble Tea
    content: 'I would like to try Bubble Tea. I chose it because Taiwanese friends say original brown sugar boba milk is unmatched! It looks sweet and chewy.',
    language: 'en',
    submittedAt: '2026-09-11 09:40',
    isApproved: true,
    isHidden: false,
    likesCount: 2,
    likedBy: ['T7A4', 'T9E3']
  },

  // Alice (Taiwan) - Act 4: Food Poll
  {
    id: 'sub-08',
    activityId: 'act-04',
    membershipId: 'm-tw-01',
    participantCode: 'T7A4',
    englishNickname: 'Alice',
    partnerSide: 'Taiwan Class',
    type: 'poll',
    selectedOptions: ['opt-kr-1'], // Tteokbokki
    content: 'I would like to try Tteokbokki. I chose it because I saw it in Korean variety shows and K-dramas! It looks vibrant red, spicy, and chewy.',
    language: 'en',
    submittedAt: '2026-09-11 11:20',
    isApproved: true,
    isHidden: false,
    likesCount: 3,
    likedBy: ['K7M4', 'K5L1', 'K2R7']
  }
];

// Initial Comments
export const initialComments: Comment[] = [
  {
    id: 'cmt-01',
    submissionId: 'sub-03', // Sunny's Hanok post
    activityId: 'act-02',
    membershipId: 'm-tw-01',
    participantCode: 'T7A4',
    englishNickname: 'Alice',
    partnerSide: 'Taiwan Class',
    content: 'Hanbok colors look so gorgeous! What color hanbok do you recommend for visitors, Sunny?',
    createdAt: '2026-09-08 14:00',
    isHidden: false
  },
  {
    id: 'cmt-02',
    submissionId: 'sub-04', // Kevin's Jiufen post
    activityId: 'act-02',
    membershipId: 'm-kr-01',
    participantCode: 'K7M4',
    englishNickname: 'Sunny',
    partnerSide: 'Korea Class',
    content: 'Wow, Jiufen red lanterns look magical at dusk! I really want to try taro balls when I visit Taiwan.',
    createdAt: '2026-09-09 17:10',
    isHidden: false
  }
];

// Initial Teacher Notes
export const initialTeacherNotes: Record<string, TeacherPrivateNote> = {
  'm-kr-01': {
    id: 'note-kr-01',
    roomId: 'room-kr-tw-01',
    membershipId: 'm-kr-01',
    teacherId: 'teacher-kr-01',
    note: '모든 필수 활동(자기소개, 문화소개, 투표)을 성실히 이행함. 상대국 학생과의 소통에서 배려 있는 영문 표현을 적극적으로 사용함.',
    updatedAt: '2026-09-11 18:00'
  }
};
