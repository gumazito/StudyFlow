'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTheme } from '@/lib/contexts/ThemeContext';

interface Question {
  id: string;
  type: 'multiple-choice' | 'drag-drop' | 'fill-blank' | 'passage' | 'correction' | 'writing';
  domain: 'Numeracy' | 'Reading' | 'Language Conventions' | 'Writing';
  difficulty: 'easy' | 'medium' | 'hard';
  yearLevel: 7 | 9;
  question: string;
  passage?: string;
  options?: string[];
  correctAnswer?: string | string[];
  correctAnswers?: string[];
  items?: string[];
  correctOrder?: string[];
  criteria?: string[];
  timeLimit?: number;
  points: number;
}

interface QuestionResponse {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  timeSpent: number;
  points: number;
}

interface ResultsData {
  yearLevel: 7 | 9;
  domain: string;
  totalPoints: number;
  maxPoints: number;
  band: number;
  percentCorrect: number;
  responses: QuestionResponse[];
  timeSpent: number;
  completedAt: Date;
}

const QUESTION_BANK: Question[] = [
  // Year 7 Numeracy
  {
    id: 'n7-1',
    type: 'multiple-choice',
    domain: 'Numeracy',
    yearLevel: 7,
    difficulty: 'easy',
    question: 'What is 24 ÷ 8?',
    options: ['2', '3', '4', '5'],
    correctAnswer: '3',
    points: 1,
  },
  {
    id: 'n7-2',
    type: 'multiple-choice',
    domain: 'Numeracy',
    yearLevel: 7,
    difficulty: 'medium',
    question: 'If a rectangle has a length of 12 cm and a width of 5 cm, what is its area?',
    options: ['17 cm²', '34 cm²', '60 cm²', '120 cm²'],
    correctAnswer: '60 cm²',
    points: 1,
  },
  {
    id: 'n7-3',
    type: 'fill-blank',
    domain: 'Numeracy',
    yearLevel: 7,
    difficulty: 'medium',
    question: 'Complete: 3/4 + 1/4 = ___',
    correctAnswer: '1',
    points: 1,
  },
  {
    id: 'n7-4',
    type: 'multiple-choice',
    domain: 'Numeracy',
    yearLevel: 7,
    difficulty: 'hard',
    question: 'A shop offers a 20% discount on a $50 item. What is the final price?',
    options: ['$30', '$35', '$40', '$45'],
    correctAnswer: '$40',
    points: 2,
  },
  {
    id: 'n7-5',
    type: 'drag-drop',
    domain: 'Numeracy',
    yearLevel: 7,
    difficulty: 'medium',
    question: 'Arrange these numbers in ascending order:',
    items: ['0.35', '1/3', '0.3', '1/4'],
    correctOrder: ['1/4', '0.3', '1/3', '0.35'],
    points: 1,
  },

  // Year 7 Reading
  {
    id: 'r7-1',
    type: 'passage',
    domain: 'Reading',
    yearLevel: 7,
    difficulty: 'easy',
    passage:
      'The platypus is one of Australia\'s most unique animals. It is one of only five species of egg-laying mammals in the world. The platypus lives in clean, flowing streams and rivers along the eastern coast of Australia.',
    question: 'Where do platypuses live?',
    options: [
      'In deserts',
      'In clean, flowing streams and rivers',
      'In the ocean',
      'In underground burrows only',
    ],
    correctAnswer: 'In clean, flowing streams and rivers',
    points: 1,
  },
  {
    id: 'r7-2',
    type: 'passage',
    domain: 'Reading',
    yearLevel: 7,
    difficulty: 'medium',
    passage:
      'Climate change is affecting ocean temperatures worldwide. Warmer waters are causing coral bleaching, where corals lose their colour and often die. This impacts the entire ecosystem that depends on coral reefs for survival.',
    question: 'What is the main consequence of warmer ocean temperatures according to the passage?',
    options: [
      'More fish are born',
      'Coral bleaching occurs and ecosystems are impacted',
      'Ocean levels rise',
      'Fisheries produce more',
    ],
    correctAnswer: 'Coral bleaching occurs and ecosystems are impacted',
    points: 1,
  },
  {
    id: 'r7-3',
    type: 'passage',
    domain: 'Reading',
    yearLevel: 7,
    difficulty: 'medium',
    passage:
      'Renewable energy sources like solar and wind power are becoming increasingly popular. Unlike fossil fuels, they do not produce greenhouse gases and are sustainable for the future.',
    question: 'Why are renewable energies preferred to fossil fuels?',
    options: [
      'They are cheaper',
      'They produce more energy',
      'They do not produce greenhouse gases and are sustainable',
      'They are easier to install',
    ],
    correctAnswer: 'They do not produce greenhouse gases and are sustainable',
    points: 1,
  },
  {
    id: 'r7-4',
    type: 'passage',
    domain: 'Reading',
    yearLevel: 7,
    difficulty: 'hard',
    passage:
      'The invention of the printing press revolutionised the spread of information. Before its development, books were painstakingly copied by hand, making them rare and expensive. This meant knowledge was restricted to the wealthy and the church.',
    question: 'What inference can be made about knowledge before the printing press?',
    options: [
      'Everyone had equal access to books',
      'Knowledge was accessible only to certain groups',
      'Books were more valuable than gold',
      'Writing had not been invented yet',
    ],
    correctAnswer: 'Knowledge was accessible only to certain groups',
    points: 2,
  },
  {
    id: 'r7-5',
    type: 'passage',
    domain: 'Reading',
    yearLevel: 7,
    difficulty: 'hard',
    passage:
      'Artificial intelligence is transforming healthcare. AI algorithms can now detect certain cancers earlier than human doctors, analyse medical scans, and predict patient outcomes. However, doctors believe AI should complement, not replace, human expertise.',
    question: 'What is the author\'s implied position on AI in healthcare?',
    options: [
      'AI will replace all doctors soon',
      'AI has no role in modern medicine',
      'AI should work alongside doctors to improve care',
      'AI is only useful for routine tasks',
    ],
    correctAnswer: 'AI should work alongside doctors to improve care',
    points: 2,
  },

  // Year 7 Language Conventions
  {
    id: 'lc7-1',
    type: 'correction',
    domain: 'Language Conventions',
    yearLevel: 7,
    difficulty: 'easy',
    question: 'Which sentence is correctly punctuated?',
    options: [
      'She went to the park, and she played tennis.',
      'She went to the park and she played tennis',
      'She went to the park. and she played tennis.',
      'She went to the park and, she played tennis.',
    ],
    correctAnswer: 'She went to the park, and she played tennis.',
    points: 1,
  },
  {
    id: 'lc7-2',
    type: 'correction',
    domain: 'Language Conventions',
    yearLevel: 7,
    difficulty: 'easy',
    question: 'Choose the correct spelling:',
    options: ['recieve', 'recieve', 'receive', 'recieve'],
    correctAnswer: 'receive',
    points: 1,
  },
  {
    id: 'lc7-3',
    type: 'correction',
    domain: 'Language Conventions',
    yearLevel: 7,
    difficulty: 'medium',
    question: 'Which sentence uses the correct subject-verb agreement?',
    options: [
      'The group of students are working together.',
      'The group of students is working together.',
      'The group of students am working together.',
      'The group of students were working together.',
    ],
    correctAnswer: 'The group of students is working together.',
    points: 1,
  },
  {
    id: 'lc7-4',
    type: 'correction',
    domain: 'Language Conventions',
    yearLevel: 7,
    difficulty: 'hard',
    question: 'Identify the error in this sentence: "Their going to the movies later tonight."',
    options: [
      'Spelling of "movies"',
      'Should be "They\'re" not "Their"',
      'Missing punctuation',
      'Incorrect verb tense',
    ],
    correctAnswer: 'Should be "They\'re" not "Their"',
    points: 2,
  },
  {
    id: 'lc7-5',
    type: 'correction',
    domain: 'Language Conventions',
    yearLevel: 7,
    difficulty: 'hard',
    question: 'Which sentence is grammatically correct?',
    options: [
      'Between you and me, I think this is the best option.',
      'Between you and I, I think this is the best option.',
      'Between me and you, I think this is the best option.',
      'Between myself and you, I think this is the best option.',
    ],
    correctAnswer: 'Between you and me, I think this is the best option.',
    points: 2,
  },

  // Year 7 Writing Prompts
  {
    id: 'w7-1',
    type: 'writing',
    domain: 'Writing',
    yearLevel: 7,
    difficulty: 'medium',
    question:
      'Write a persuasive text (150-200 words) explaining why students should have more breaks during the school day.',
    criteria: [
      'Clear thesis statement',
      'At least two supporting reasons',
      'Evidence or examples',
      'Logical conclusion',
      'Correct spelling and punctuation',
    ],
    points: 10,
  },
  {
    id: 'w7-2',
    type: 'writing',
    domain: 'Writing',
    yearLevel: 7,
    difficulty: 'medium',
    question: 'Write a narrative (150-200 words) about a time you overcame a challenge.',
    criteria: [
      'Clear introduction of characters/setting',
      'Sequence of events',
      'Descriptive language',
      'Clear resolution',
      'Correct spelling and punctuation',
    ],
    points: 10,
  },
  {
    id: 'w7-3',
    type: 'writing',
    domain: 'Writing',
    yearLevel: 7,
    difficulty: 'hard',
    question:
      'Write a persuasive text (200-250 words) arguing for or against mandatory school uniforms.',
    criteria: [
      'Clear position statement',
      'At least three well-developed reasons',
      'Acknowledgement of counterarguments',
      'Persuasive language techniques',
      'Logical conclusion with call to action',
      'Correct spelling and punctuation',
    ],
    points: 15,
  },
  {
    id: 'w7-4',
    type: 'writing',
    domain: 'Writing',
    yearLevel: 7,
    difficulty: 'hard',
    question: 'Write a narrative (200-250 words) based on this prompt: "The discovery changed everything."',
    criteria: [
      'Engaging opening',
      'Well-developed characters',
      'Vivid descriptive details',
      'Clear conflict and resolution',
      'Reflective ending',
      'Correct spelling and punctuation',
    ],
    points: 15,
  },
  {
    id: 'w7-5',
    type: 'writing',
    domain: 'Writing',
    yearLevel: 7,
    difficulty: 'medium',
    question: 'Write an informative text (150-200 words) explaining how something in your area works.',
    criteria: [
      'Clear topic introduction',
      'Logical sequence of information',
      'Relevant details and facts',
      'Clear conclusion',
      'Correct spelling and punctuation',
    ],
    points: 10,
  },

  // Year 9 Numeracy
  {
    id: 'n9-1',
    type: 'multiple-choice',
    domain: 'Numeracy',
    yearLevel: 9,
    difficulty: 'easy',
    question: 'Simplify: 3x + 2x - x',
    options: ['4x', '5x', '6x', '2x'],
    correctAnswer: '4x',
    points: 1,
  },
  {
    id: 'n9-2',
    type: 'multiple-choice',
    domain: 'Numeracy',
    yearLevel: 9,
    difficulty: 'medium',
    question: 'If 2(x + 3) = 14, what is the value of x?',
    options: ['2', '3', '4', '5'],
    correctAnswer: '4',
    points: 1,
  },
  {
    id: 'n9-3',
    type: 'fill-blank',
    domain: 'Numeracy',
    yearLevel: 9,
    difficulty: 'medium',
    question: 'A circle has a radius of 5 cm. Its area is approximately ___ cm² (use π ≈ 3.14)',
    correctAnswer: '78.5',
    points: 1,
  },
  {
    id: 'n9-4',
    type: 'multiple-choice',
    domain: 'Numeracy',
    yearLevel: 9,
    difficulty: 'hard',
    question:
      'In a survey of 200 students, 45% said they exercise regularly. How many students is this?',
    options: ['45', '80', '90', '110'],
    correctAnswer: '90',
    points: 2,
  },
  {
    id: 'n9-5',
    type: 'multiple-choice',
    domain: 'Numeracy',
    yearLevel: 9,
    difficulty: 'hard',
    question:
      'What is the probability of rolling a 3 or a 5 on a standard six-sided die?',
    options: ['1/6', '1/3', '1/2', '2/3'],
    correctAnswer: '1/3',
    points: 2,
  },

  // Year 9 Reading
  {
    id: 'r9-1',
    type: 'passage',
    domain: 'Reading',
    yearLevel: 9,
    difficulty: 'easy',
    passage:
      'The Great Barrier Reef is the world\'s largest coral reef system, located off the coast of Queensland, Australia. It stretches over 2,300 kilometres and contains thousands of species of fish, corals, and marine life.',
    question: 'Which state in Australia has the Great Barrier Reef?',
    options: ['New South Wales', 'Queensland', 'Western Australia', 'Victoria'],
    correctAnswer: 'Queensland',
    points: 1,
  },
  {
    id: 'r9-2',
    type: 'passage',
    domain: 'Reading',
    yearLevel: 9,
    difficulty: 'medium',
    passage:
      'The Industrial Revolution transformed society from agrarian to industrial. Mechanisation increased productivity, but also created harsh working conditions in factories. Many workers, including children, laboured long hours in dangerous environments.',
    question: 'What is the main contrast presented in the passage?',
    options: [
      'Agricultural work versus factory work',
      'Increased productivity versus poor working conditions',
      'Child labour versus adult labour',
      'British industry versus European industry',
    ],
    correctAnswer: 'Increased productivity versus poor working conditions',
    points: 1,
  },
  {
    id: 'r9-3',
    type: 'passage',
    domain: 'Reading',
    yearLevel: 9,
    difficulty: 'hard',
    passage:
      'Neuroplasticity is the brain\'s ability to reorganise itself by forming new neural connections throughout life. This capacity allows the human brain to recover from injury and to learn new skills at any age. Research demonstrates that consistent practice and mental effort can literally reshape the physical structure of the brain.',
    question: 'What does the passage imply about learning ability in older adults?',
    options: [
      'It is impossible after a certain age',
      'It requires less effort than in younger people',
      'It is possible due to neuroplasticity',
      'It only works for simple skills',
    ],
    correctAnswer: 'It is possible due to neuroplasticity',
    points: 2,
  },
  {
    id: 'r9-4',
    type: 'passage',
    domain: 'Reading',
    yearLevel: 9,
    difficulty: 'hard',
    passage:
      'The concept of "dark matter" has puzzled astronomers for decades. Observations show that galaxies rotate too quickly to be held together by visible matter alone. Scientists theorise that invisible dark matter, comprising approximately 85% of the universe\'s matter, provides the necessary gravitational force.',
    question: 'What can be inferred about the relationship between dark matter and visible matter?',
    options: [
      'Visible matter is more abundant than dark matter',
      'Dark matter plays a crucial role in maintaining galactic structure',
      'Dark matter is located only at the centres of galaxies',
      'Visible matter and dark matter have the same properties',
    ],
    correctAnswer: 'Dark matter plays a crucial role in maintaining galactic structure',
    points: 2,
  },
  {
    id: 'r9-5',
    type: 'passage',
    domain: 'Reading',
    yearLevel: 9,
    difficulty: 'hard',
    passage:
      'Philosophers debate whether artificial intelligence can truly be conscious. Some argue that consciousness requires subjective experience, which machines cannot possess. Others suggest that if AI can replicate all the functions of consciousness, the distinction becomes meaningless.',
    question: 'What is the central disagreement discussed in the passage?',
    options: [
      'Whether AI is useful to society',
      'Whether consciousness is a philosophical or scientific question',
      'Whether consciousness requires subjective experience or functional equivalence',
      'Whether AI will ever be developed',
    ],
    correctAnswer: 'Whether consciousness requires subjective experience or functional equivalence',
    points: 2,
  },

  // Year 9 Language Conventions
  {
    id: 'lc9-1',
    type: 'correction',
    domain: 'Language Conventions',
    yearLevel: 9,
    difficulty: 'easy',
    question: 'Which sentence is punctuated correctly?',
    options: [
      'The colours of the flag: red, white and blue.',
      'The colours of the flag are: red, white and blue.',
      'The colours of the flag, red, white and blue.',
      'The colours of the flag red white and blue.',
    ],
    correctAnswer: 'The colours of the flag are: red, white and blue.',
    points: 1,
  },
  {
    id: 'lc9-2',
    type: 'correction',
    domain: 'Language Conventions',
    yearLevel: 9,
    difficulty: 'medium',
    question: 'Which sentence demonstrates correct parallel structure?',
    options: [
      'She likes reading, to write, and painting.',
      'She likes reading, writing, and painting.',
      'She likes to read, to write, and painting.',
      'She likes reading, writing, and to paint.',
    ],
    correctAnswer: 'She likes reading, writing, and painting.',
    points: 1,
  },
  {
    id: 'lc9-3',
    type: 'correction',
    domain: 'Language Conventions',
    yearLevel: 9,
    difficulty: 'hard',
    question: 'Identify the error: "Who should I give this assignment to?"',
    options: [
      'Should be "Who should I give this assignment too?"',
      'Should be "Whom should I give this assignment to?"',
      'Should be "Whoever should I give this assignment to?"',
      'The sentence is correct',
    ],
    correctAnswer: 'Should be "Whom should I give this assignment to?"',
    points: 2,
  },
  {
    id: 'lc9-4',
    type: 'correction',
    domain: 'Language Conventions',
    yearLevel: 9,
    difficulty: 'hard',
    question: 'Which sentence uses the subjunctive mood correctly?',
    options: [
      'If I was in charge, I would change this policy.',
      'If I were in charge, I would change this policy.',
      'If I am in charge, I change this policy.',
      'If I would be in charge, I would change this policy.',
    ],
    correctAnswer: 'If I were in charge, I would change this policy.',
    points: 2,
  },
  {
    id: 'lc9-5',
    type: 'correction',
    domain: 'Language Conventions',
    yearLevel: 9,
    difficulty: 'hard',
    question: 'Which sentence uses correct apostrophe placement?',
    options: [
      'The boys\' uniforms were cleaned.',
      'The boy\'s uniforms were cleaned.',
      'The boys uniforms\' were cleaned.',
      'The boys uniforms were cleaned\'.',
    ],
    correctAnswer: 'The boys\' uniforms were cleaned.',
    points: 2,
  },

  // Year 9 Writing Prompts
  {
    id: 'w9-1',
    type: 'writing',
    domain: 'Writing',
    yearLevel: 9,
    difficulty: 'medium',
    question:
      'Write a persuasive text (250-300 words) arguing why young people should be encouraged to volunteer in their communities.',
    criteria: [
      'Clear thesis with position',
      'Multiple well-developed arguments',
      'Evidence and examples',
      'Acknowledgement of alternative views',
      'Persuasive techniques employed',
      'Conclusion that reinforces position',
      'Correct spelling and punctuation',
    ],
    points: 15,
  },
  {
    id: 'w9-2',
    type: 'writing',
    domain: 'Writing',
    yearLevel: 9,
    difficulty: 'hard',
    question:
      'Write a narrative (300-350 words) about a moment that changed your perspective on something important.',
    criteria: [
      'Engaging and specific opening',
      'Well-developed characters with distinct voices',
      'Vivid sensory details',
      'Clear turning point',
      'Reflection on how the moment changed perspective',
      'Sophisticated narrative techniques',
      'Correct spelling and punctuation',
    ],
    points: 15,
  },
  {
    id: 'w9-3',
    type: 'writing',
    domain: 'Writing',
    yearLevel: 9,
    difficulty: 'hard',
    question:
      'Write an analytical text (250-300 words) examining the causes and effects of a social issue you consider important.',
    criteria: [
      'Clear introduction of the issue',
      'Logical analysis of multiple causes',
      'Explanation of significant effects',
      'Supporting evidence and examples',
      'Conclusion that synthesises analysis',
      'Sophisticated vocabulary and structure',
      'Correct spelling and punctuation',
    ],
    points: 15,
  },
  {
    id: 'w9-4',
    type: 'writing',
    domain: 'Writing',
    yearLevel: 9,
    difficulty: 'medium',
    question:
      'Write a persuasive text (250-300 words) on a contemporary issue, such as environmental protection or technology use in schools.',
    criteria: [
      'Clear position on the issue',
      'At least three supporting arguments',
      'Logical reasoning and evidence',
      'Counter-arguments considered',
      'Concluding statement',
      'Correct spelling and punctuation',
    ],
    points: 15,
  },
  {
    id: 'w9-5',
    type: 'writing',
    domain: 'Writing',
    yearLevel: 9,
    difficulty: 'hard',
    question: 'Write an informative text (250-300 words) explaining a complex concept in your field of interest.',
    criteria: [
      'Clear and engaging introduction',
      'Logical sequencing of information',
      'Detailed explanations with examples',
      'Technical vocabulary used appropriately',
      'Concluding statement that summarises',
      'Correct spelling and punctuation',
    ],
    points: 15,
  },
];

function calculateBand(
  percentCorrect: number,
  yearLevel: 7 | 9,
): number {
  const minBand = yearLevel === 7 ? 5 : 6;
  const maxBand = 10;

  if (percentCorrect >= 90) return maxBand;
  if (percentCorrect >= 80) return maxBand - 1;
  if (percentCorrect >= 70) return maxBand - 2;
  if (percentCorrect >= 60) return maxBand - 3;
  if (percentCorrect >= 50) return minBand + 1;
  return minBand;
}

function getNationalAverage(domain: string, yearLevel: 7 | 9): number {
  const averages: Record<string, Record<7 | 9, number>> = {
    'Reading': { 7: 68, 9: 72 },
    'Writing': { 7: 64, 9: 70 },
    'Numeracy': { 7: 66, 9: 71 },
    'Language Conventions': { 7: 70, 9: 75 },
  };
  return averages[domain]?.[yearLevel] || 65;
}

interface NaplanPracticeProps {
  onClose: () => void;
  yearLevel?: string;
}

export default function NaplanPractice({
  onClose,
  yearLevel: initialYearLevel,
}: NaplanPracticeProps) {
  const { user } = useAuth();
  const { dark: isDark } = useTheme();

  const [stage, setStage] = useState<'selection' | 'practice' | 'results'>(
    'selection'
  );
  const [selectedYearLevel, setSelectedYearLevel] = useState<7 | 9>(
    initialYearLevel?.includes('9') ? 9 : 7
  );
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [writingAnswer, setWritingAnswer] = useState('');
  const [results, setResults] = useState<ResultsData | null>(null);

  const practiceQuestions = useMemo(() => {
    return QUESTION_BANK.filter(
      (q) =>
        q.yearLevel === selectedYearLevel &&
        q.domain === selectedDomain
    ).sort(() => Math.random() - 0.5);
  }, [selectedYearLevel, selectedDomain]);

  const currentQuestion = practiceQuestions[currentQuestionIndex];

  useEffect(() => {
    if (stage !== 'practice') return;

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSubmit = useCallback(
    (answer: string | string[]) => {
      const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);

      if (!currentQuestion) return;

      let isCorrect = false;

      if (currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'correction') {
        isCorrect = answer === currentQuestion.correctAnswer;
      } else if (currentQuestion.type === 'fill-blank') {
        isCorrect =
          answer.toString().toLowerCase().trim() ===
          currentQuestion.correctAnswer?.toString().toLowerCase().trim();
      } else if (currentQuestion.type === 'passage') {
        isCorrect = answer === currentQuestion.correctAnswer;
      } else if (currentQuestion.type === 'drag-drop') {
        isCorrect = JSON.stringify(answer) === JSON.stringify(currentQuestion.correctOrder);
      } else if (currentQuestion.type === 'writing') {
        // For writing, we'll do basic validation (check if something was written)
        isCorrect = answer.toString().trim().length > 50;
      }

      const points = isCorrect ? currentQuestion.points : 0;

      setResponses((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          answer,
          isCorrect,
          timeSpent,
          points,
        },
      ]);

      if (currentQuestionIndex < practiceQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setQuestionStartTime(Date.now());
        setWritingAnswer('');
      } else {
        finishPractice();
      }
    },
    [currentQuestion, currentQuestionIndex, practiceQuestions, questionStartTime]
  );

  const finishPractice = useCallback(() => {
    const totalPoints = responses.reduce((sum, r) => sum + r.points, 0);
    const maxPoints = practiceQuestions.reduce((sum, q) => sum + q.points, 0);
    const percentCorrect = (totalPoints / maxPoints) * 100;
    const band = calculateBand(percentCorrect, selectedYearLevel);

    const resultsData: ResultsData = {
      yearLevel: selectedYearLevel,
      domain: selectedDomain,
      totalPoints,
      maxPoints,
      band,
      percentCorrect: Math.round(percentCorrect),
      responses,
      timeSpent: timeElapsed,
      completedAt: new Date(),
    };

    setResults(resultsData);
    setStage('results');
  }, [responses, practiceQuestions, selectedYearLevel, selectedDomain, timeElapsed]);

  const handleStartPractice = () => {
    if (!selectedDomain) return;
    setStage('practice');
    setQuestionStartTime(Date.now());
  };

  const handleRestartPractice = () => {
    setStage('selection');
    setSelectedDomain('');
    setCurrentQuestionIndex(0);
    setResponses([]);
    setTimeElapsed(0);
    setResults(null);
    setWritingAnswer('');
    setQuestionStartTime(Date.now());
  };

  const domains = ['Reading', 'Writing', 'Numeracy', 'Language Conventions'];

  // Selection Stage
  if (stage === 'selection') {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg)',
          color: 'var(--text)',
          borderColor: 'var(--border)',
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <div
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border)',
          }}
          className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border p-6"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold">NAPLAN Practice</h2>
            <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm">
              Select your year level and test domain to begin practising
            </p>
          </div>

          {/* Year Level Selection */}
          <div className="mb-6">
            <h3 className="mb-3 font-semibold">Year Level</h3>
            <div className="grid grid-cols-2 gap-3">
              {[7, 9].map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYearLevel(year as 7 | 9)}
                  style={{
                    backgroundColor:
                      selectedYearLevel === year
                        ? 'var(--primary)'
                        : 'var(--bg-card)',
                    borderColor:
                      selectedYearLevel === year
                        ? 'var(--primary)'
                        : 'var(--border)',
                    color:
                      selectedYearLevel === year
                        ? 'white'
                        : 'var(--text)',
                  }}
                  className="rounded-lg border px-4 py-3 font-medium transition-all"
                >
                  Year {year}
                </button>
              ))}
            </div>
          </div>

          {/* Domain Selection */}
          <div className="mb-8">
            <h3 className="mb-3 font-semibold">Test Domain</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {domains.map((domain) => (
                <button
                  key={domain}
                  onClick={() => setSelectedDomain(domain)}
                  style={{
                    backgroundColor:
                      selectedDomain === domain
                        ? 'var(--primary)'
                        : 'var(--bg-card)',
                    borderColor:
                      selectedDomain === domain
                        ? 'var(--primary)'
                        : 'var(--border)',
                    color:
                      selectedDomain === domain
                        ? 'white'
                        : 'var(--text)',
                  }}
                  className="rounded-lg border px-4 py-3 font-medium transition-all"
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Time */}
          {selectedDomain && (
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border)',
              }}
              className="mb-6 rounded-lg border p-4"
            >
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                Estimated time: 40-65 minutes
              </p>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                {selectedDomain !== 'Writing'
                  ? `Questions: ${QUESTION_BANK.filter((q) => q.yearLevel === selectedYearLevel && q.domain === selectedDomain).length}`
                  : 'Writing tasks assessed on multiple criteria'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
              className="flex-1 rounded-lg border px-4 py-2 font-medium transition-all hover:opacity-80"
            >
              Cancel
            </button>
            <button
              onClick={handleStartPractice}
              disabled={!selectedDomain}
              style={{
                backgroundColor: selectedDomain ? 'var(--primary)' : 'var(--text-muted)',
                color: 'white',
              }}
              className="flex-1 rounded-lg px-4 py-2 font-medium transition-all disabled:cursor-not-allowed"
            >
              Start Practice
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Practice Stage
  if (stage === 'practice' && currentQuestion) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg)',
          color: 'var(--text)',
        }}
        className="fixed inset-0 z-50 flex flex-col"
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)',
          }}
          className="border-b p-4"
        >
          <div className="mx-auto max-w-4xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-bold">
                  {selectedDomain} - Year {selectedYearLevel}
                </h2>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                  Question {currentQuestionIndex + 1} of{' '}
                  {practiceQuestions.length}
                </p>
              </div>
              <div
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                }}
                className="rounded-lg border px-3 py-2 text-right font-mono text-sm"
              >
                <div style={{ color: 'var(--text-secondary)' }} className="text-xs">
                  Time
                </div>
                <div>{formatTime(timeElapsed)}</div>
              </div>
            </div>
            <div
              style={{ backgroundColor: 'var(--text-muted)' }}
              className="h-1 overflow-hidden rounded-full"
            >
              <div
                style={{
                  backgroundColor: 'var(--primary)',
                  width: `${((currentQuestionIndex + 1) / practiceQuestions.length) * 100}%`,
                }}
                className="h-full transition-all"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-4xl">
            {/* Passage for Reading/Analysis */}
            {currentQuestion.passage && (
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                }}
                className="mb-6 rounded-lg border p-4 italic"
              >
                {currentQuestion.passage}
              </div>
            )}

            {/* Question */}
            <div className="mb-6">
              <h3 className="mb-4 text-lg font-semibold">
                {currentQuestion.question}
              </h3>

              {/* Multiple Choice */}
              {(currentQuestion.type === 'multiple-choice' ||
                currentQuestion.type === 'passage' ||
                currentQuestion.type === 'correction') && (
                <div className="space-y-2">
                  {currentQuestion.options?.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSubmit(option)}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }}
                      className="w-full rounded-lg border p-3 text-left transition-all hover:border-blue-500"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Fill in the Blank */}
              {currentQuestion.type === 'fill-blank' && (
                <div>
                  <input
                    type="text"
                    placeholder="Enter your answer"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.currentTarget as HTMLInputElement;
                        handleAnswerSubmit(target.value);
                      }
                    }}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border)',
                      color: 'var(--text)',
                    }}
                    className="w-full rounded-lg border px-3 py-2 mb-3"
                  />
                  <button
                    onClick={(e) => {
                      const input = (
                        e.currentTarget.parentElement as HTMLElement
                      ).querySelector('input') as HTMLInputElement;
                      handleAnswerSubmit(input.value);
                    }}
                    style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                    className="rounded-lg px-4 py-2 font-medium"
                  >
                    Submit Answer
                  </button>
                </div>
              )}

              {/* Drag and Drop Ordering */}
              {currentQuestion.type === 'drag-drop' && (
                <div className="space-y-2">
                  <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                    Drag items to arrange in order (currently: automatic)
                  </p>
                  <div className="space-y-2">
                    {currentQuestion.items?.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border)',
                        }}
                        className="rounded-lg border p-2 text-sm"
                      >
                        {idx + 1}. {item}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      handleAnswerSubmit(currentQuestion.items || [])
                    }
                    style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                    className="mt-4 w-full rounded-lg px-4 py-2 font-medium"
                  >
                    Submit Order
                  </button>
                </div>
              )}

              {/* Writing */}
              {currentQuestion.type === 'writing' && (
                <div>
                  {currentQuestion.criteria && (
                    <div
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border)',
                      }}
                      className="mb-4 rounded-lg border p-3"
                    >
                      <p style={{ color: 'var(--text-secondary)' }} className="mb-2 text-xs font-semibold uppercase">
                        Assessment Criteria:
                      </p>
                      <ul className="space-y-1 text-sm">
                        {currentQuestion.criteria.map((criterion, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span style={{ color: 'var(--text-secondary)' }}>•</span>
                            {criterion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <textarea
                    value={writingAnswer}
                    onChange={(e) => setWritingAnswer(e.target.value)}
                    placeholder="Write your response here..."
                    rows={10}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border)',
                      color: 'var(--text)',
                    }}
                    className="mb-3 w-full rounded-lg border p-3"
                  />
                  <div className="flex gap-2">
                    <span style={{ color: 'var(--text-secondary)' }} className="text-xs">
                      Word count: {writingAnswer.split(/\s+/).filter(Boolean).length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAnswerSubmit(writingAnswer)}
                    disabled={writingAnswer.trim().length < 50}
                    style={{
                      backgroundColor:
                        writingAnswer.trim().length >= 50
                          ? 'var(--primary)'
                          : 'var(--text-muted)',
                      color: 'white',
                    }}
                    className="mt-4 w-full rounded-lg px-4 py-2 font-medium disabled:cursor-not-allowed"
                  >
                    Submit Response ({Math.max(0, 50 - writingAnswer.trim().length)} chars
                    remaining)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Stage
  if (stage === 'results' && results) {
    const nationalAverage = getNationalAverage(results.domain, results.yearLevel);
    const bandDescription = (band: number): string => {
      if (band >= 9) return 'Excellent';
      if (band >= 8) return 'Very Good';
      if (band >= 7) return 'Good';
      if (band >= 6) return 'Satisfactory';
      return 'Needs Improvement';
    };

    return (
      <div
        style={{
          backgroundColor: 'var(--bg)',
          color: 'var(--text)',
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <div
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border)',
          }}
          className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border p-6"
        >
          {/* Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold">Practice Complete!</h2>
            <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm">
              Year {results.yearLevel} {results.domain}
            </p>
          </div>

          {/* Band Score */}
          <div
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
            }}
            className="mb-6 rounded-lg p-6 text-center"
          >
            <p style={{ color: 'rgba(255,255,255,0.8)' }} className="text-sm">Estimated Band</p>
            <div className="text-5xl font-bold">{results.band}</div>
            <p className="mt-2 text-sm">{bandDescription(results.band)}</p>
          </div>

          {/* Score Breakdown */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
            className="mb-6 rounded-lg border p-4"
          >
            <h3 className="mb-4 font-semibold">Performance Summary</h3>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Score</span>
                  <span className="font-mono">
                    {results.totalPoints} / {results.maxPoints}
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                  }}
                  className="h-2 overflow-hidden rounded-full border"
                >
                  <div
                    style={{
                      backgroundColor: 'var(--success)',
                      width: `${(results.totalPoints / results.maxPoints) * 100}%`,
                    }}
                    className="h-full transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Accuracy</span>
                  <span className="font-mono">{results.percentCorrect}%</span>
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                  }}
                  className="h-2 overflow-hidden rounded-full border"
                >
                  <div
                    style={{
                      backgroundColor: 'var(--accent)',
                      width: `${results.percentCorrect}%`,
                    }}
                    className="h-full transition-all"
                  />
                </div>
              </div>

              <div className="text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Time taken: </span>
                <span className="font-mono">{formatTime(results.timeSpent)}</span>
              </div>
            </div>
          </div>

          {/* Comparison to National Average */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
            className="mb-6 rounded-lg border p-4"
          >
            <h3 className="mb-3 font-semibold">National Comparison</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Your score</span>
                <span className="font-mono">{results.percentCorrect}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>
                  National average
                </span>
                <span style={{ color: 'var(--text-secondary)' }} className="font-mono">
                  {nationalAverage}%
                </span>
              </div>
              <div className="mt-2 text-center">
                {results.percentCorrect >= nationalAverage ? (
                  <p style={{ color: 'var(--success)' }} className="text-sm font-medium">
                    ✓ Above national average
                  </p>
                ) : (
                  <p style={{ color: 'var(--warning)' }} className="text-sm font-medium">
                    Below national average
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
            className="mb-6 rounded-lg border p-4"
          >
            <h3 className="mb-3 font-semibold">Recommendations</h3>
            <ul style={{ color: 'var(--text-secondary)' }} className="space-y-2 text-sm">
              {results.percentCorrect >= 90 && (
                <>
                  <li>• You're performing exceptionally well. Focus on maintaining this level.</li>
                  <li>• Consider practising the more challenging questions to aim for Band 10.</li>
                </>
              )}
              {results.percentCorrect >= 70 && results.percentCorrect < 90 && (
                <>
                  <li>• You're on track for a strong band. Continue regular practice.</li>
                  <li>• Review questions you found challenging and practice similar types.</li>
                </>
              )}
              {results.percentCorrect >= 50 && results.percentCorrect < 70 && (
                <>
                  <li>• Focus on key concepts in {results.domain}.</li>
                  <li>• Practice regularly to improve your accuracy and speed.</li>
                </>
              )}
              {results.percentCorrect < 50 && (
                <>
                  <li>• Start with foundational concepts in {results.domain}.</li>
                  <li>• Ask your teacher for support with difficult topics.</li>
                  <li>• Practice questions regularly to build confidence.</li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
              className="flex-1 rounded-lg border px-4 py-2 font-medium transition-all hover:opacity-80"
            >
              Close
            </button>
            <button
              onClick={handleRestartPractice}
              style={{
                backgroundColor: 'var(--primary)',
                color: 'white',
              }}
              className="flex-1 rounded-lg px-4 py-2 font-medium transition-all hover:opacity-90"
            >
              Try Another Domain
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
