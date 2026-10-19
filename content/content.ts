import type { FlipbookPageMeta } from '@/types/flipbook'
import manifest from './flipbook.manifest.json'

export interface TimelineItem {
  id: string
  dateISO: string
  displayDate: string
  title: string
  body: string
  image?: string
}

export interface VideoConfig {
  src: string | null
  poster: string
  skipAfterSec: number
  title: string
  caption: string
  placeholderText: string
}

export interface QuizQuestion {
  key: 'q1' | 'q2' | 'q3'
  title: string
  subtitle?: string
  type: 'chips-text' | 'textarea'
  chips?: string[]
  revealText?: string
  reactionText?: string
  placeholder: string
  maxLength?: number
}

export interface ContentData {
  gate: {
    title: string
    placeholder: string
    buttonText: string
    salt: string
    answerHash: string
    wrongMessages: string[]
    hint: string
    successMessage: string
  }
  counter: {
    startDate: string
    eyebrow: string
    dayLabel: string
    hourLabel: string
    minuteLabel: string
    secondLabel: string
    anniversaryNotice: string
    continueButton: string
  }
  video: VideoConfig
  quiz: {
    eyebrow: string
    questions: [QuizQuestion, QuizQuestion, QuizQuestion]
    submitButton: string
    completeEyebrow: string
    completeTitle: string
    continueButton: string
  }
  timeline: {
    eyebrow: string
    title: string
    items: TimelineItem[]
    continueButton: string
  }
  flipbook: {
    eyebrow: string
    title: string
    holdHint: string
    holdText: string
    openedText: string
    bookEyebrow: string
    coverTitle: string
    backTitle: string
    notesText: string
    pages: FlipbookPageMeta[]
    finishButton: string
  }
  finale: {
    eyebrow: string
    dayLabel: string
    openSheetButton: string
    sheetTitle: string
    sheetPlaceholder: string
    sheetSubmit: string
    sheetSending: string
    sheetSent: string
    replayFlipbook: string
    replayStart: string
  }
}

export const content: ContentData = {
  gate: {
    title: 'Ngày mình bắt đầu là ngày nào?',
    placeholder: 'dd/mm/yyyy',
    buttonText: 'Mở khóa',
    salt: 'anniv_salt_20251020_love',
    answerHash: '0648b69c8f44d9d39d8f093b33789bda10f330f299a47e6ca826c457e3a7c59b',
    wrongMessages: [
      'Chưa đúng rồi, thử lại nhé',
      'Vẫn chưa đúng nè, nghĩ lại chút xem',
      'Gần đúng chưa nhỉ? Thử lại một lần nữa nhé',
    ],
    hint: 'Gợi ý: đó là một ngày của tháng Mười',
    successMessage: 'Đúng rồi nè...',
  },
  counter: {
    startDate: '2025-10-20T00:00:00+07:00',
    eyebrow: 'MÌNH ĐÃ BÊN NHAU',
    dayLabel: 'ngày',
    hourLabel: 'giờ',
    minuteLabel: 'phút',
    secondLabel: 'giây',
    anniversaryNotice: 'Tròn 1 năm',
    continueButton: 'Tiếp tục',
  },
  video: {
    src: process.env.NEXT_PUBLIC_VIDEO_URL || '/media/intro.mp4',
    poster: '/media/intro-poster.webp',
    skipAfterSec: 5,
    title: 'Những ngày mình bên nhau',
    caption: 'Một chút dịu dàng dành cho chúng mình',
    placeholderText: 'Đang chuẩn bị',
  },
  quiz: {
    eyebrow: 'CÂU HỎI',
    questions: [
      {
        key: 'q1',
        title: 'Anh thích ăn gì nhất?',
        type: 'chips-text',
        chips: ['Phở', 'Bún', 'Lẩu', 'Pizza', 'Món khác'],
        revealText: 'Đáp án đúng: món gì cũng được, miễn là đi với em.',
        placeholder: 'Viết điều em nghĩ nhé',
      },
      {
        key: 'q2',
        title: 'Nếu được làm một hoạt động với anh, em sẽ muốn làm gì?',
        type: 'textarea',
        reactionText: 'Anh ghi lại rồi nhé.', // [CONTENT_TODO: Personal reaction line for Q2]
        placeholder: 'Cứ viết thật lòng nhé',
        maxLength: 500,
      },
      {
        key: 'q3',
        title: 'Anh muốn em tăng thêm 4kg được không?',
        type: 'textarea',
        reactionText: 'Anh luôn yêu thương và ủng hộ em.', // [CONTENT_TODO: Personal reaction line for Q3]
        placeholder: 'Cứ viết thật lòng nhé',
        maxLength: 500,
      },
    ],
    submitButton: 'Trả lời',
    completeEyebrow: 'MÌNH HIỂU NHAU HƠN MỘT CHÚT',
    completeTitle: 'Cảm ơn em đã trả lời',
    continueButton: 'Tiếp tục',
  },
  timeline: {
    eyebrow: 'NHỮNG TRANG MÌNH ĐÃ VIẾT',
    title: 'Chuyện của chúng mình',
    items: [
      {
        id: 'tl-1',
        dateISO: '2025-10-20',
        displayDate: '20.10.2025',
        title: 'Ngày bắt đầu',
        body: '[Ngày đầu tiên hai đứa chính thức đồng hành cùng nhau.]',
      },
      {
        id: 'tl-2',
        dateISO: '2025-09-20',
        displayDate: '20.09.2025',
        title: '[Lần đầu gặp nhau ở Sgonnn]',
        body: '[Anh note lần đầu tiên nha em iu Mi]',
      },
      {
        id: 'tl-3',
        dateISO: '2026-03-21',
        displayDate: '21.03.2026',
        title: '[Chuyến đi đầu tiên]',
        body: '[Chuyến đi xa đầu tiên thật nhiều niềm vui và kỉ niệm với em yêu]',
      },
      {
        id: 'tl-4',
        dateISO: '2026-10-20',
        displayDate: 'Hôm nay',
        title: 'Hành trình tiếp tục',
        body: '[Những ngày tháng phía trước vẫn còn nhiều điều đẹp đẽ đang chờ đón anh và em]',
      },
    ],
    continueButton: 'Tiếp tục',
  },
  flipbook: {
    eyebrow: 'MỘT ĐIỀU NHỎ DÀNH CHO EM',
    title: 'Mở thư của chúng mình',
    holdHint: 'Nhấn và giữ con dấu một chút nhé',
    holdText: 'Giữ',
    openedText: 'Mở',
    bookEyebrow: 'NHỮNG TRANG DÀNH CHO EM',
    coverTitle: 'Một năm của mình',
    backTitle: 'Hẹn năm sau',
    notesText: '',
    pages: manifest.pages as FlipbookPageMeta[],
    finishButton: 'Xem xong rồi',
    bonusSpread: {
      image: '/media/scrapbook-spread.png',
      heyzineUrl: 'https://heyzine.com/flip-book/2ad0a89618.html',
      badge: 'QUÀ TẶNG ĐẶC BIỆT',
      title: 'Vé xem phim kỷ niệm',
      subtitle: 'OUR STORY – FULL VERSION',
      tagline: 'Quét mã QR trên cuống vé hoặc nhấn nút bên dưới để mở toàn bộ câu chuyện:',
      openButtonText: 'Mở quà tặng đặc biệt 🎁',
      heyzineButtonText: 'Mở xem Heyzine Flipbook ↗',
      closeText: 'Đóng',
    },
  },
  finale: {
    eyebrow: 'HÀNH TRÌNH CỦA CHÚNG MÌNH',
    dayLabel: 'ngày',
    openSheetButton: 'Gửi lại cho anh',
    sheetTitle: 'Gửi lại cho anh',
    sheetPlaceholder: 'Em muốn nói gì với anh?',
    sheetSubmit: 'Gửi',
    sheetSending: 'Đang gửi...',
    sheetSent: 'Đã gửi cho anh',
    replayFlipbook: 'Xem lại flipbook',
    replayStart: 'Xem lại từ đầu',
  },
}
