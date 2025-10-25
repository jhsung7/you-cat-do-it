// Web Speech API를 사용한 음성 인식
export const startVoiceRecognition = (
  onResult: (transcript: string) => void,
  onError?: (error: string) => void,
  language: 'ko' | 'en' = 'ko'
): SpeechRecognition | null => {
  // 브라우저 호환성 체크
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    onError?.(language === 'ko' 
      ? '음성 인식을 지원하지 않는 브라우저입니다. Chrome을 사용해주세요.' 
      : 'Voice recognition not supported. Please use Chrome.'
    );
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = language === 'ko' ? 'ko-KR' : 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log('🎤 Recognized:', transcript);
    onResult(transcript);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    onError?.(language === 'ko' 
      ? '음성 인식 중 오류가 발생했습니다.' 
      : 'Voice recognition error occurred.'
    );
  };

  recognition.onend = () => {
    console.log('🎤 Recognition ended');
  };

  recognition.start();
  console.log('🎤 Recognition started');
  
  return recognition;
};

// 음성 인식 중지
export const stopVoiceRecognition = (recognition: SpeechRecognition | null) => {
  if (recognition) {
    try {
      recognition.stop();
      console.log('🎤 Recognition stopped');
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  }
};