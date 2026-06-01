import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Shield, Zap, Sparkles, Sword, Play, BrainCircuit, Wand2, Loader2, User, MapPin, Plus, Trash2, Save, ChevronUp, ChevronDown, Radio, X, Terminal, Download, Upload, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import { aiService } from '../services/aiService';

type CreationTab = 'world' | 'mc' | 'npc' | 'items';

import { getWorldCreationSystemInstruction, getIdeaDeveloperSystemInstruction } from '../utils/worldCreationSystemInstruction';
import { repairTruncatedJson, escapeLiteralNewlinesInJson } from '../utils/jsonRepair';

export default function WorldCreation() {
  const theme = useStore(state => state.theme);
  const setFullScreenStream = useStore(state => state.setFullScreenStream);
  const setIsGeneratingStream = useStore(state => state.setIsGeneratingStream);
  const updateStreamData = useStore(state => state.updateStreamData);
  const worldCreation = useStore(state => state.worldCreation);
  const updateWorldCreation = useStore(state => state.updateWorldCreation);
  const resetWorldCreation = useStore(state => state.resetWorldCreation);
  const setGameData = useStore(state => state.setGameData);
  
  const navigate = useNavigate();

  const { 
    initialIdea, 
    developedIdea, 
    worldData, 
    mcData, 
    npcs, 
    worldDetails 
  } = worldCreation;

  const [activeTab, setActiveTab] = useState<CreationTab>('world');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDevelopingIdea, setIsDevelopingIdea] = useState(false);
  const [genTimer, setGenTimer] = useState(0);
  const [devTimer, setDevTimer] = useState(0);

  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (saveMenuRef.current && !saveMenuRef.current.contains(event.target as Node)) {
        setIsSaveMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [isInitialIdeaCollapsed, setIsInitialIdeaCollapsed] = useState(() => {
    return localStorage.getItem('isInitialIdeaCollapsed') === 'true';
  });
  const [isDevelopedIdeaCollapsed, setIsDevelopedIdeaCollapsed] = useState(() => {
    return localStorage.getItem('isDevelopedIdeaCollapsed') === 'true';
  });
  const [collapsedNpcs, setCollapsedNpcs] = useState<Record<number, boolean>>({});

  const toggleNpc = (idx: number) => {
    setCollapsedNpcs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    localStorage.setItem('isInitialIdeaCollapsed', String(isInitialIdeaCollapsed));
  }, [isInitialIdeaCollapsed]);

  useEffect(() => {
    localStorage.setItem('isDevelopedIdeaCollapsed', String(isDevelopedIdeaCollapsed));
  }, [isDevelopedIdeaCollapsed]);

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setGenTimer(0);
      interval = setInterval(() => setGenTimer(prev => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    let interval: any;
    if (isDevelopingIdea) {
      setDevTimer(0);
      interval = setInterval(() => setDevTimer(prev => prev + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isDevelopingIdea]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const contentRef = React.useRef<HTMLDivElement>(null);

  const scrollToTop = () => contentRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  const scrollToBottom = () => contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: 'instant' });

  // Helper setters that update store
  const setInitialIdea = (val: string) => updateWorldCreation({ initialIdea: val });
  const activeProxyId = useStore(state => state.activeProxyId);
  const proxies = useStore(state => state.proxies);

  const setDevelopedIdea = (val: string | ((p: string) => string)) => {
    updateWorldCreation((draft) => {
      draft.developedIdea = typeof val === 'function' ? val(draft.developedIdea) : val;
    });
  };
  const setWorldData = (val: typeof worldData) => updateWorldCreation({ worldData: val });
  const setMcData = (val: typeof mcData) => updateWorldCreation({ mcData: val });
  const setNpcs = (val: typeof npcs) => updateWorldCreation({ npcs: val });
  const setWorldDetails = (val: typeof worldDetails) => updateWorldCreation({ worldDetails: val });

  const handleAIGenerate = async () => {
    if (!initialIdea.trim()) {
      toast.error('Vui lòng nhập ý tưởng sơ khai để AI có thể bắt đầu!');
      return;
    }

    setIsGenerating(true);
    setIsGeneratingStream(true);
    updateStreamData('');

    try {
      const systemInstruction = getWorldCreationSystemInstruction();

const prompt = `Ý tưởng người chơi cung cấp:
- Ý tưởng sơ khai: "${initialIdea}"
- Ý tưởng đã phát triển: "${developedIdea}"

Dưới đây là các thông tin người chơi ĐÃ ĐIỀN (hãy giữ nguyên các thông tin này, không được thay đổi):
\`\`\`json
{
  "worldData": ${JSON.stringify(worldData)},
  "mcData": ${JSON.stringify(mcData)},
  "npcs": ${JSON.stringify(npcs)},
  "worldDetails": ${JSON.stringify(worldDetails)}
}
\`\`\`

Dữ liệu trả về PHẢI là một object JSON duy nhất với cấu trúc chính xác sau:
{
  "worldData": { 
    "name": "Tên của câu chuyện / Tên tựa game (Tuyệt đối không phải tên lục địa/hành tinh/vũ trụ trong game)", 
    "background": "Bối cảnh thế giới chi tiết", 
    "starterTimeline": "Mốc thời gian mở đầu cụ thể", 
    "starterScenario": "Kịch bản mở đầu lôi cuốn", 
    "worldRules": "Quy tắc, luật lệ, cấm kỵ của thế giới",
    "namingConventions": "Quy tắc đặt tên cho nhân vật, địa danh, vật phẩm (Ví dụ: phong cách Nhật Bản trung cổ, Cyberpunk, v.v.)",
    "genre": "Thể loại",
    "mainMood": "Âm hưởng chủ đạo (Main Mood & Aesthetic)",
    "pacing": "Nhịp độ (Pacing)",
    "geography": "Địa lý & Vùng lãnh thổ",
    "worldHistory": "Lịch sử thế giới",
    "culture": "Văn hóa & Phong tục",
    "economy": "Kinh tế & Xã hội",
    "religion": "Tôn giáo & Tín ngưỡng",
    "factions": "Các quốc gia & Thế lực",
    "factionRelations": "Mối quan hệ thế lực",
    "uniqueElements": "Các yếu tố độc đáo",
    "powerSystem": "Hệ thống sức mạnh / Logic phân bậc",
    "logicControl": "Kiểm soát Logic & Yếu tố loại trừ",
    "writingStyle": "Văn Phong",
    "narrativePerspective": "Ngôi Kể"
  },
  "mcData": {
    "name": "Tên gọi", 
    "fullName": "Họ và Tên đầy đủ", 
    "titles": "Danh xưng, Tước hiệu", 
    "occupation": "Chức vụ, Nghề nghiệp", 
    "gender": "Giới tính", 
    "age": "Tuổi tác", 
    "dob": "Ngày tháng năm sinh", 
    "rank": "Cấu trúc Cảnh giới hoặc Chỉ số", 
    "height": "Chiều cao", 
    "weight": "Cân nặng", 
    "measurements": "Số đo 3 vòng (Chỉ ghi số, VD: 90-60-90 (Cup D). Cấm ghi dài dòng) / Thể hình (Nam)", 
    "appearance": "Miêu tả ngoại hình bẩm sinh", 
    "distinguishingFeatures": "Đặc trưng nhận diện phụ", 
    "powers": [{"name": "Tên năng lực/sức mạnh", "description": "Mô tả chi tiết năng lực", "type": "Loại năng lực", "level": "Cấp độ (nếu có)"}], 
    "skills": [{"name": "Tên kỹ năng", "description": "Mô tả chi tiết", "type": "Loại kỹ năng", "level": "Độ thuần thục"}], 
    "personality": "Tính cách tổng quan bên ngoài", 
    "personalityCore": "Bản ngã cốt lõi tận cùng của tâm hồn", 
    "philosophy": "Triết lý sống, tín ngưỡng cá nhân", 
    "goal": "Mục tiêu tối thượng", 
    "background": "Nguồn gốc, Xuất thân, Hoàn cảnh khởi đầu", 
    "innerSecret": "Những bí mật sâu kín", 
    "loveViews": "Quan niệm về ái tình, sự chung thủy, tình dục", 
    "experience": "Kinh nghiệm tình trường (trinh tiết, thủ thân hay từng trải)", 
    "nsfwPersonality": "Bản chất khi NSFW (dâm đãng, thẹn thùng, thống trị, phục tùng)", 
    "nsfwReactions": "Phản ứng cơ thể, tiếng rên, nét mặt khi bị kích thích", 
    "literaryDescription": "Ngoại hình và chân dung văn học khởi đầu hoàn chỉnh cúa MC (Cấm viết spoil diễn biến sắp xảy ra)",
    "inventory": [{
      "name": "Tên vật phẩm",
      "quantity": 1,
      "description": "Mô tả công năng / Đặc điểm"
    }]
  },
  "npcs": [{
    "LƯU_Ý_TỐI_THƯỢNG": "ĐIỀN ĐỦ 100% CÁC TRƯỜNG DƯỚI ĐÂY, NGHIÊM CẤM BỎ TRỐNG, KHÔNG DÙNG 'N/A' HAY '...'. PHẢI SÁNG TẠO ĐẦY ĐỦ. ĐẶC BIỆT: CẤM SPOIL TƯƠNG LAI!",
    "name": "Tên NPC", 
    "fullName": "Họ và tên NPC", 
    "titles": "Danh xưng, Tước hiệu", 
    "occupation": "Chức vụ, Vai trò", 
    "role": "Vai trò (Vd: Kẻ Địch, Hỗ trợ)",
    "background": "Lai lịch (lồng ghép binh khí, đan dược nếu có). CẤM SPOIL CỐT TRUYỆN MỚI!",
    "gender": "Giới tính", 
    "age": "Tuổi tác", 
    "dob": "Ngày tháng năm sinh", 
    "rank": "Cảnh giới, Cấp độ", 
    "height": "Chiều cao", 
    "weight": "Cân nặng", 
    "measurements": "Số đo 3 vòng (Chỉ ghi số, VD: 90-60-90 (Cup D). Cấm ghi dài dòng) / Thể hình (Nam)", 
    "appearance": "Miêu tả ngoại hình tổng quan (vô cùng chi tiết với nữ giới)", 
    "powers": [{"name": "Tên năng lực/sức mạnh", "description": "Mô tả chi tiết năng lực", "type": "Loại năng lực", "level": "Cấp độ (nếu có)"}], 
    "skills": [{"name": "Tên kỹ năng", "description": "Mô tả chi tiết", "type": "Loại kỹ năng", "level": "Độ thuần thục"}], 
    "personality": "Tính cách tổng quan (Thể hiện bên ngoài)", 
    "personalityCore": "Bản ngã cốt lõi tận cùng của tâm hồn (Cấm thêm suy diễn sự kiện cốt truyện tương lai vào đây)", 
    "philosophy": "Triết lý sống, tín ngưỡng cá nhân", 
    "goal": "Mục tiêu đời người NPC đang theo đuổi", 
    "distinguishingFeatures": "Đặc trưng nhận diện phụ (nốt ruồi, sẹo, cách nói chuyện)", 
    "innerSecret": "Những bí mật sâu kín NPC che giấu", 
    "relationships": [{"name": "Tên nhân vật", "relation": "Mối quan hệ", "status": "Tình trạng", "description": "Mô tả chi tiết. LƯU Ý TỐI THƯỢNG: NẾU CHƯA TỪNG GẶP/CHƯA QUEN BIẾT THÌ NGHIÊM CẤM TẠO LIÊN KẾT QUAN HỆ TRONG MẢNG NÀY (Tuyệt đối không tạo kiểu 'Người lạ', 'Chưa gặp mặt'. Rất vô lý và spoil. Hãy để mảng trống [] nếu không quen ai)"}], 
    "loveViews": "Quan điểm về ái tình, sự chung thủy, tình dục", 
    "experience": "Kinh nghiệm tình trường (trinh tiết, thủ thân hay từng trải, bạo dạn)", 
    "nsfwPersonality": "Bản chất khi NSFW (dâm đãng, thẹn thùng, thống trị, phục tùng)", 
    "nsfwReactions": "Phản ứng cơ thể, tiếng rên, nét mặt khi bị kích thích", 
    "literaryDescription": "Chân dung văn học khắc họa NPC ban đầu (Tuyệt đối không chèn tiên tri / spoil diễn biến truyện vào phần chân dung này)"
  }],
  "worldDetails": { "places": "Mô tả chi tiết các địa điểm quan trọng hoặc những nơi các nhân vật sẽ xuất hiện hoặc đi đến bước đầu" }
}`;

      const result = aiService.generateStreamingContent(prompt, undefined, systemInstruction);

      let fullText = "";

      for await (const chunk of result) {
        if (chunk.thought) {
          updateStreamData(prev => prev + chunk.thought);
        }
        if (chunk.text) {
          fullText += chunk.text;
          updateStreamData(prev => prev + chunk.text);
        }
      }

      // Sau khi stream xong, cố gắng parse JSON để cập nhật UI
      try {
        const jsonMatch = fullText.match(/<json_output>\s*({[\s\S]*?})\s*(?:<\/json_output>|$)/) || 
                         fullText.match(/```json\s*({[\s\S]*?})(?:```|$)/) || 
                         fullText.match(/({[\s\S]*)/);
                         
        if (jsonMatch) {
          let rawJson = jsonMatch[1];
          rawJson = escapeLiteralNewlinesInJson(rawJson);
          rawJson = repairTruncatedJson(rawJson);
          
          const data = JSON.parse(rawJson);
          if (data.worldData) setWorldData(data.worldData);
          if (data.mcData) setMcData(data.mcData);
          if (data.npcs) setNpcs(data.npcs);
          if (data.worldDetails) setWorldDetails(data.worldDetails);
          toast.success('Matrix Lite v3 đã sẵn sàng!');
        }
      } catch (parseError) {
        console.warn("Could not parse AI response as JSON perfectly, but stream completed.", parseError);
        toast.info("Có lỗi định dạng do độ dài nội dung, AI chưa cấu trúc đủ dữ liệu.");
      }

    } catch (error: any) {
      console.error('AI Generation Error:', error);
      useStore.getState().setSystemLogs(`[LỖI TẠO THẾ GIỚI - ${new Date().toLocaleTimeString()}] ${error?.message || error}\n\n`);
      toast.error('AI đang bận hoặc gặp lỗi. Vui lòng thử lại sau!');
    } finally {
      setIsGenerating(false);
      setIsGeneratingStream(false);
    }
  };

  const handleDevelopIdea = async () => {
    if (!initialIdea.trim()) {
      toast.error('Vui lòng nhập ý tưởng sơ khai!');
      return;
    }

    setIsDevelopingIdea(true);
    setIsGeneratingStream(true);
    updateStreamData('>>> Đang kích hoạt Deep Reasoning Matrix...\n>>> Phân tích ý tưởng sơ khai...\n>>> Kết nối Gemini 3.1 Pro (High Thinking) để phát triển ý tưởng...\n\n');
    
    try {
      const systemInstruction = getIdeaDeveloperSystemInstruction();
      const prompt = `Từ ý tưởng sơ khai dưới đây:
"${initialIdea}"

Hãy tiến hành suy nghĩ trong thẻ <THINKING_PROCESS> và phát triển nó thành một ý tưởng chi tiết, sâu sắc, bao gồm bối cảnh, mâu thuẫn chính và nét độc đáo của thế giới này. 
Hãy trình bày một cách cuốn hút và logic. BẮT BUỘC TRẢ LỜI VÀ SUY NGHĨ TOÀN BỘ BẰNG TIẾNG VIỆT 100%.`;

      const result = aiService.generateStreamingContent(prompt, undefined, systemInstruction);

      let fullText = "";
      let hasText = false;
      let thoughtBuffer = "";
      setDevelopedIdea(''); 
      for await (const chunk of result) {
        if (chunk.thought) {
          thoughtBuffer += chunk.thought;
          updateStreamData(prev => prev + chunk.thought);
        }
        if (chunk.text) {
          hasText = true;
          fullText += chunk.text;
          // Loại bỏ thinking process khi hiển thị kết quả cuối
          const cleanText = fullText.replace(/<THINKING_PROCESS>[\s\S]*?<\/THINKING_PROCESS>/g, '').trim();
          setDevelopedIdea(cleanText || fullText);
          updateStreamData(prev => prev + chunk.text);
        }
      }
      if (!hasText && thoughtBuffer) {
        // Fallback in case the model generated the entire output inside the "thought" section
        setDevelopedIdea(thoughtBuffer);
      }
      toast.success('Ý tưởng đã được phát triển thành công!');
    } catch (error: any) {
       console.error('Develop Idea Error:', error);
       useStore.getState().setSystemLogs(`[LỖI PHÁT TRIỂN Ý TƯỞNG - ${new Date().toLocaleTimeString()}] ${error?.message || error}\n\n`);
       toast.error('Lỗi khi phát triển ý tưởng.');
    } finally {
       setIsDevelopingIdea(false);
       setIsGeneratingStream(false);
    }
  };

  const handleCreate = () => {
    if (!worldData.name.trim()) {
      toast.error('Vui lòng nhập tên thế giới!');
      return;
    }
    toast.success(`Đang khởi tạo thế giới "${worldData.name}"...`);
    // Clear old messages and set game data
    useStore.getState().setMessages([]);
    setGameData({
      initialIdea,
      developedIdea,
      worldData,
      mcData,
      originalMcData: JSON.parse(JSON.stringify(mcData)),
      npcs,
      originalNpcs: JSON.parse(JSON.stringify(npcs)),
      worldDetails
    });
    setTimeout(() => {
      navigate('/gameplay');
    }, 1000);
  };

  const handleSaveData = () => {
    const dataToSave = {
      initialIdea,
      developedIdea,
      worldData,
      mcData,
      npcs,
      worldDetails
    };
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Tên game + tên thế giới + tên MC + ngày tháng năm
    const date = new Date();
    const dateStr = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    // Replace matching characters but keep Vietnamese characters if possible, or just replace spaces
    const safeWorldName = worldData.name ? worldData.name.replace(/\\s+/g, '_') : 'TheGioi';
    const safeMcName = mcData.name ? mcData.name.replace(/\\s+/g, '_') : 'MC';
    a.download = `Matrix_Lite_v3_${safeWorldName}_${safeMcName}_${dateStr}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsSaveMenuOpen(false);
  };

  const handleLoadDataClick = () => {
    fileInputRef.current?.click();
    setIsSaveMenuOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        updateWorldCreation(data);
        toast.success("Tải dữ liệu thế giới thành công!");
      } catch (err) {
        toast.error("Tệp không hợp lệ hoặc dữ liệu bị lỗi!");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input to allow loading the same file again if needed
  };

  const tabs = [
    { id: 'world', label: 'World', icon: Globe },
    { id: 'mc', label: 'MC', icon: User },
    { id: 'npc', label: 'NPCs', icon: Sword },
    { id: 'items', label: 'Location', icon: MapPin },
  ] as const;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      {/* Sticky Header */}
      <div className={`sticky top-0 z-30 w-full backdrop-blur-3xl border-b border-white/5 py-4 px-4 md:px-6 lg:px-8 ${theme.bgClass}/80 shadow-lg shadow-black/5`}>
        <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Action Row */}
          <div className="flex items-center gap-2">
              <input 
                type="file"
                accept=".json"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div className="relative" ref={saveMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSaveMenuOpen(!isSaveMenuOpen)}
                  className={`p-2.5 rounded-xl border transition-all shadow-md cursor-pointer flex items-center gap-1 ${
                    theme.group === 'Dark' 
                      ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' 
                      : 'border-black/10 bg-white/80 text-[#334155] hover:bg-black/5'
                  }`}
                  title="Dữ liệu"
                >
                  <Save size={20} />
                  <ChevronDownIcon size={14} className={`transition-transform ${isSaveMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>
                
                <AnimatePresence>
                  {isSaveMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`absolute top-full left-0 mt-2 w-48 rounded-xl border shadow-2xl overflow-hidden z-50 ${
                        theme.group === 'Dark' 
                          ? 'border-white/10 bg-black/90 backdrop-blur-xl text-white' 
                          : 'border-black/10 bg-white/80 text-[#334155]'
                      }`}
                    >
                      <button
                        onClick={handleSaveData}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${
                          theme.group === 'Dark' 
                            ? 'text-white/80 hover:text-white hover:bg-white/10' 
                            : 'text-[#334155] hover:text-[#0f172a] hover:bg-black/5'
                        }`}
                      >
                        <Download size={16} />
                        Lưu vào máy tính
                      </button>
                      <div className={`h-[1px] w-full ${theme.group === 'Dark' ? 'bg-white/10' : 'bg-black/10'}`} />
                      <button
                        onClick={handleLoadDataClick}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${
                          theme.group === 'Dark' 
                            ? 'text-white/80 hover:text-white hover:bg-white/10' 
                            : 'text-[#334155] hover:text-[#0f172a] hover:bg-black/5'
                        }`}
                      >
                        <Upload size={16} />
                        Tải lên từ máy
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
 
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setFullScreenStream(true)}
                 className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 px-3 ${
                   theme.group === 'Dark' 
                     ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' 
                     : 'border-black/10 bg-white/80 text-[#334155] hover:bg-black/5'
                 }`}
                 title="Stream"
               >
                 <Radio size={20} className={isGenerating ? "animate-pulse text-red-500" : ""} />
                 <span className="text-sm font-bold hidden md:inline">Stream</span>
               </motion.button>
 
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => {
                   resetWorldCreation();
                 }}
                 className={`p-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-all text-red-400 cursor-pointer flex items-center gap-2 px-3`}
                 title="Reset"
               >
                 <X size={20} />
                 <span className="text-sm font-bold hidden md:inline">RESET</span>
               </motion.button>
               
               <div className={`flex rounded-xl border p-1 ${theme.group === 'Dark' ? 'bg-white/5 border-white/10' : 'bg-white/80 border-black/10 shadow-sm'}`}>
                 <button 
                   onClick={scrollToTop}
                   className={`p-1.5 rounded-lg transition-all cursor-pointer ${theme.group === 'Dark' ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-[#334155] hover:text-[#0f172a] hover:bg-black/5'}`}
                   title="Lên trên"
                 >
                   <ChevronUp size={18} />
                 </button>
                 <button 
                   onClick={scrollToBottom}
                   className={`p-1.5 rounded-lg transition-all cursor-pointer ${theme.group === 'Dark' ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-[#334155] hover:text-[#0f172a] hover:bg-black/5'}`}
                   title="Xuống dưới"
                 >
                   <ChevronDown size={18} />
                 </button>
               </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreate}
                className={`p-2.5 rounded-xl border border-blue-500/30 bg-blue-600 hover:bg-blue-500 transition-all text-white shadow-lg shadow-blue-600/20 cursor-pointer flex items-center gap-2 px-4 md:px-6 shrink-0`}
                title="Start"
              >
                <Play size={20} className="fill-current" />
                <span className="text-sm font-black italic hidden md:inline tracking-widest">START</span>
              </motion.button>
            </div>

          {/* Navigation Tabs Row */}
          <div className={`flex p-1 rounded-xl border backdrop-blur-md overflow-x-auto no-scrollbar scrollbar-hide w-fit ${theme.group === 'Dark' ? 'bg-white/5 border-white/10' : 'bg-white/80 border-black/10 shadow-xs'}`}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const label = tab.id === 'npc' ? `NPCs (${npcs.length})` : tab.label;
              const isDark = theme.group === 'Dark';
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as CreationTab)}
                  className={`px-3 md:px-5 py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold flex items-center gap-2 transition-all relative cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive 
                      ? (isDark ? theme.textPrimary : 'text-white font-bold') 
                      : (isDark ? 'text-white/40 hover:text-white/70' : 'text-[#334155]/70 hover:text-[#0f172a]')
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-creation-tab"
                      className={`absolute inset-0 rounded-lg md:rounded-xl ${isDark ? 'bg-white/20 border border-white/10 shadow-lg shadow-white/5' : 'bg-slate-800 border border-amber-700 shadow-md shadow-amber-500/10'}`}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <tab.icon className="w-3 md:w-4 h-3 md:h-4 z-10" />
                  <span className="z-10">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Scrollable Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 md:px-8 lg:px-6 xl:px-8 pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="space-y-12">
              <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-12"
              >
              {activeTab === 'world' && (
                <div className="flex flex-col gap-10 items-stretch">
                  {/* Ideas Section */}
                  <div className="space-y-10">
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => setIsInitialIdeaCollapsed(!isInitialIdeaCollapsed)}
                          className={`text-sm font-bold uppercase tracking-widest ${theme.textSecondary} flex items-center gap-2 hover:text-white transition-colors cursor-pointer group`}
                        >
                          <BrainCircuit className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" /> Ý tưởng sơ khai
                          {isInitialIdeaCollapsed ? <ChevronDown className="w-4 h-4 opacity-70" /> : <ChevronUp className="w-4 h-4 opacity-70" />}
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleAIGenerate}
                          disabled={isGenerating}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 text-sm font-bold hover:bg-purple-600/30 transition-all cursor-pointer disabled:opacity-50 relative overflow-hidden group"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>{formatTime(genTimer)}</span>
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4" />
                              <span>AI Sáng tạo tất cả</span>
                            </>
                          )}
                          {isGenerating && (
                            <motion.div 
                              layoutId="gen-progress"
                              className="absolute bottom-0 left-0 h-0.5 bg-purple-500 w-full"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                        </motion.button>
                      </div>
                      <AnimatePresence>
                        {!isInitialIdeaCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <CharacterTextArea 
                              label=""
                              value={initialIdea}
                              onChange={setInitialIdea}
                              placeholder="Mô tả ngắn gọn về vũ trụ (ví dụ: Một hòn đảo bay nơi rồng và robot cùng tồn tại...)"
                              variant="large"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>

                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => setIsDevelopedIdeaCollapsed(!isDevelopedIdeaCollapsed)}
                          className={`text-sm font-bold uppercase tracking-widest ${theme.textSecondary} flex items-center gap-2 hover:text-white transition-colors cursor-pointer group`}
                        >
                          <Sparkles className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" /> Ý tưởng do AI phát triển
                          {isDevelopedIdeaCollapsed ? <ChevronDown className="w-4 h-4 opacity-70" /> : <ChevronUp className="w-4 h-4 opacity-70" />}
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleDevelopIdea}
                          disabled={isDevelopingIdea || !initialIdea.trim()}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-bold hover:bg-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isDevelopingIdea ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>{formatTime(devTimer)}</span>
                            </>
                          ) : (
                            <>
                              <BrainCircuit className="w-4 h-4" />
                              <span>AI phát triển ý tưởng</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                      <AnimatePresence>
                        {!isDevelopedIdeaCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <CharacterTextArea 
                              label=""
                              value={developedIdea}
                              onChange={setDevelopedIdea}
                              placeholder="Ý tưởng chi tiết sẽ xuất hiện ở đây sau khi AI xử lý..."
                              variant="large"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>
                  </div>

                  {/* World Details Section */}
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="TÊN TRÒ CHƠI / TÊN CÂU CHUYỆN"
                        value={worldData.name}
                        onChange={(val) => setWorldData({...worldData, name: val})}
                        placeholder="Nhập tên trò chơi..."
                        variant="title"
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="BỐI CẢNH"
                        value={worldData.background}
                        onChange={(val) => setWorldData({...worldData, background: val})}
                        placeholder="Mô tả bối cảnh thế giới..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="MỐC THỜI GIAN MỞ ĐẦU"
                        value={worldData.starterTimeline}
                        onChange={(val) => setWorldData({...worldData, starterTimeline: val})}
                        placeholder="Ví dụ: Năm 2045, Kỷ nguyên thứ 3..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="KỊCH BẢN MỞ ĐẦU"
                        value={worldData.starterScenario}
                        onChange={(val) => setWorldData({...worldData, starterScenario: val})}
                        placeholder="Diễn biến khởi đầu của câu chuyện..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="QUY TẮC THẾ GIỚI (LUẬT LỆ, CẤM KỴ, QUY LUẬT VẬN HÀNH)"
                        value={worldData.worldRules}
                        onChange={(val) => setWorldData({...worldData, worldRules: val})}
                        placeholder="Những luật lệ và quy luật của thế giới này..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="QUY TẮC ĐẶT TÊN (NAMING CONVENTIONS)"
                        value={worldData.namingConventions || ''}
                        onChange={(val) => setWorldData({...worldData, namingConventions: val})}
                        placeholder="Quy tắc đặt và chọn tên cho mọi thực thể trong thế giới (Ví dụ: tên nhân vật theo kiểu Nhật, địa danh theo thần thoại Bắc Âu, vũ khí có gốc tiếng Latin)..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterInput
                        label="THỂ LOẠI (GENRE)"
                        value={worldData.genre}
                        onChange={(val) => setWorldData({...worldData, genre: val})}
                        placeholder="Thể loại thế giới..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterInput
                        label="ÂM HƯỞNG CHỦ ĐẠO (MAIN MOOD & AESTHETIC)"
                        value={worldData.mainMood}
                        onChange={(val) => setWorldData({...worldData, mainMood: val})}
                        placeholder="Âm hưởng, màu sắc chủ đạo..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterInput
                        label="NHỊP ĐỘ (PACING)"
                        value={worldData.pacing}
                        onChange={(val) => setWorldData({...worldData, pacing: val})}
                        placeholder="Nhịp độ diễn biến..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="ĐỊA LÝ & VÙNG LÃNH THỔ"
                        value={worldData.geography}
                        onChange={(val) => setWorldData({...worldData, geography: val})}
                        placeholder="Địa lý, vùng lãnh thổ..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="LỊCH SỬ THẾ GIỚI"
                        value={worldData.worldHistory}
                        onChange={(val) => setWorldData({...worldData, worldHistory: val})}
                        placeholder="Lịch sử thế giới..."
                      />
                    </section>
                    
                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="VĂN HÓA & PHONG TỤC"
                        value={worldData.culture}
                        onChange={(val) => setWorldData({...worldData, culture: val})}
                        placeholder="Văn hóa, ngôn ngữ, tập tục..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="KINH TẾ & XÃ HỘI"
                        value={worldData.economy}
                        onChange={(val) => setWorldData({...worldData, economy: val})}
                        placeholder="Cấu trúc kinh tế, phân hóa xã hội..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="TÔN GIÁO & TÍN NGƯỠNG"
                        value={worldData.religion}
                        onChange={(val) => setWorldData({...worldData, religion: val})}
                        placeholder="Tôn giáo chính, nghi lễ..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="CÁC QUỐC GIA & THẾ LỰC"
                        value={worldData.factions}
                        onChange={(val) => setWorldData({...worldData, factions: val})}
                        placeholder="Quốc gia, tổ chức, giáo phái..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="MỐI QUAN HỆ GIỮA CÁC THẾ LỰC"
                        value={worldData.factionRelations}
                        onChange={(val) => setWorldData({...worldData, factionRelations: val})}
                        placeholder="Xung đột, liên minh, trung lập..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="CÁC YẾU TỐ ĐỘC ĐÁO"
                        value={worldData.uniqueElements}
                        onChange={(val) => setWorldData({...worldData, uniqueElements: val})}
                        placeholder="Sinh vật đặc hữu, công nghệ cốt lõi..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="HỆ THỐNG SỨC MẠNH / LOGIC / ĐIỂM PHÂN BẬC"
                        value={worldData.powerSystem}
                        onChange={(val) => setWorldData({...worldData, powerSystem: val})}
                        placeholder="Bắt buộc chi tiết hóa bậc năng lực, rank, cảnh giới, hoặc các thước đo quyền lực..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="KIỂM SOÁT LOGIC & CÁC YẾU TỐ LOẠI TRỪ"
                        value={worldData.logicControl}
                        onChange={(val) => setWorldData({...worldData, logicControl: val})}
                        placeholder="Những thứ không được phép tồn tại trong thế giới này..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterTextArea 
                        label="VĂN PHONG"
                        value={worldData.writingStyle}
                        onChange={(val) => setWorldData({...worldData, writingStyle: val})}
                        placeholder="Văn phong miêu tả trần thuật..."
                      />
                    </section>

                    <section className="space-y-4">
                      <CharacterInput 
                        label="NGÔI KỂ"
                        value={worldData.narrativePerspective}
                        onChange={(val) => setWorldData({...worldData, narrativePerspective: val})}
                        placeholder="Ngôi thứ ba, ngôi thứ nhất..."
                      />
                    </section>
                  </div>
                </div>
              )}

              {activeTab === 'mc' && (
                <div className="space-y-8 max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Nhóm 1: Thông tin định danh */}
                    <div className="space-y-6 col-span-full">
                       <h3 className={`text-lg font-bold ${theme.textPrimary} border-l-4 border-current pl-4 flex items-center gap-2`}>
                         <User className="w-5 h-5" /> THÔNG TIN ĐỊNH DANH
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <CharacterInput label="TÊN GỌI" value={mcData.name} onChange={(val) => setMcData({...mcData, name: val})} />
                          <CharacterInput label="HỌ VÀ TÊN" value={mcData.fullName} onChange={(val) => setMcData({...mcData, fullName: val})} />
                          <CharacterInput label="DANH XƯNG (TƯỚC HIỆU)" value={mcData.titles} onChange={(val) => setMcData({...mcData, titles: val})} />
                          <CharacterInput label="CHỨC VỤ (NGHỀ NGHIỆP)" value={mcData.occupation} onChange={(val) => setMcData({...mcData, occupation: val})} />
                          <CharacterInput label="GIỚI TÍNH" value={mcData.gender} onChange={(val) => setMcData({...mcData, gender: val})} />
                          <CharacterInput label="TUỔI TÁC" value={mcData.age} onChange={(val) => setMcData({...mcData, age: val})} />
                          <CharacterInput label="NGÀY THÁNG NĂM SINH" value={mcData.dob} onChange={(val) => setMcData({...mcData, dob: val})} />
                          <CharacterInput label="CẢNH GIỚI / CẤP ĐỘ" value={mcData.rank} onChange={(val) => setMcData({...mcData, rank: val})} />
                       </div>
                    </div>

                    {/* Nhóm 2: Đặc trưng hình thể */}
                    <div className="space-y-6 col-span-full">
                       <h3 className={`text-lg font-bold ${theme.textPrimary} border-l-4 border-current pl-4 flex items-center gap-2`}>
                         <Sparkles className="w-5 h-5" /> ĐẶC TRƯNG HÌNH THỂ
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <CharacterInput label="CHIỀU CAO" value={mcData.height} onChange={(val) => setMcData({...mcData, height: val})} />
                          <CharacterInput label="CÂN NẶNG" value={mcData.weight} onChange={(val) => setMcData({...mcData, weight: val})} />
                          <CharacterInput label="SỐ ĐO 3 VÒNG" value={mcData.measurements} onChange={(val) => setMcData({...mcData, measurements: val})} />
                       </div>
                       <CharacterTextArea label="MIÊU TẢ NGOẠI HÌNH TỔNG QUAN" value={mcData.appearance} onChange={(val) => setMcData({...mcData, appearance: val})} />
                       <CharacterTextArea label="ĐẶC ĐIỂM NHẬN DẠNG PHỤ" value={mcData.distinguishingFeatures} onChange={(val) => setMcData({...mcData, distinguishingFeatures: val})} />
                    </div>

                    {/* Nhóm 3: Năng lực & Bản ngã */}
                    <div className="space-y-6 col-span-full">
                       <h3 className={`text-lg font-bold ${theme.textPrimary} border-l-4 border-current pl-4 flex items-center gap-2`}>
                         <BrainCircuit className="w-5 h-5" /> NĂNG LỰC & BẢN NGÃ
                       </h3>
                       <div className="grid grid-cols-1 gap-4">
                          <ArrayItemEditor itemLabel="Năng Lực" label="NĂNG LỰC / SỨC MẠNH" items={mcData.powers} onChange={(val) => setMcData({...mcData, powers: val})} />
                          <ArrayItemEditor itemLabel="Kỹ Năng" label="KỸ NĂNG CHUYÊN MÔN" items={mcData.skills} onChange={(val) => setMcData({...mcData, skills: val})} />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <CharacterTextArea label="TÍNH CÁCH TỔNG QUAN" value={mcData.personality} onChange={(val) => setMcData({...mcData, personality: val})} />
                          <CharacterTextArea label="TÍNH CÁCH CỐT LÕI (BẢN NGÃ)" value={mcData.personalityCore} onChange={(val) => setMcData({...mcData, personalityCore: val})} />
                          <CharacterTextArea label="KIM CHỈ NAM / LÝ TƯỞNG" value={mcData.philosophy} onChange={(val) => setMcData({...mcData, philosophy: val})} />
                          <CharacterTextArea label="MỤC TIÊU TỐI THƯỢNG" value={mcData.goal} onChange={(val) => setMcData({...mcData, goal: val})} />
                       </div>
                    </div>

                    {/* Nhóm 4: Hoàn cảnh & Nội tâm */}
                    <div className="space-y-6 col-span-full">
                       <h3 className={`text-lg font-bold ${theme.textPrimary} border-l-4 border-current pl-4 flex items-center gap-2`}>
                         <Shield className="w-5 h-5" /> HOÀN CẢNH & NỘI TÂM
                       </h3>
                       <CharacterTextArea label="NGUỒN GỐC / XUẤT THÂN / HOÀN CẢNH" value={mcData.background} onChange={(val) => setMcData({...mcData, background: val})} />
                       <CharacterTextArea label="NỘI TÂM / SUY NGHĨ THẦM KÍN / ĐỘNG CƠ ẨN" value={mcData.innerSecret} onChange={(val) => setMcData({...mcData, innerSecret: val})} />
                    </div>

                    {/* Nhóm 5: Nội dung người lớn (NSFW) */}
                    <div className="space-y-6 col-span-full">
                       <h3 className="text-lg font-bold text-rose-400 border-l-4 border-current pl-4 flex items-center gap-2">
                         <Zap className="w-5 h-5" /> CHI TIẾT ĐẶC TRƯNG & NSFW
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <CharacterTextArea label="QUAN NIỆM VỀ TÌNH YÊU & TÌNH DỤC" value={mcData.loveViews} onChange={(val) => setMcData({...mcData, loveViews: val})} />
                          <CharacterTextArea label="TRINH TIẾT VÀ KINH NGHIỆM NSFW" value={mcData.experience} onChange={(val) => setMcData({...mcData, experience: val})} />
                          <CharacterTextArea label="TÍNH CÁCH KHI NSFW" value={mcData.nsfwPersonality} onChange={(val) => setMcData({...mcData, nsfwPersonality: val})} />
                          <CharacterTextArea label="PHẢN ỨNG ĐẶC TRƯNG (NSFW)" value={mcData.nsfwReactions} onChange={(val) => setMcData({...mcData, nsfwReactions: val})} />
                       </div>
                    </div>

                    {/* Nhóm 6: Miêu tả văn học */}
                    <div className="space-y-6 col-span-full">
                       <h3 className={`text-lg font-bold ${theme.textPrimary} border-l-4 border-current pl-4 flex items-center gap-2`}>
                         <Terminal className="w-5 h-5" /> VĂN BẢN MIÊU TẢ HOÀN CHỈNH
                       </h3>
                       <CharacterTextArea label="MIÊU TẢ BẰNG NGÔN TỪ VĂN HỌC" value={mcData.literaryDescription} onChange={(val) => setMcData({...mcData, literaryDescription: val})} rows={10} />
                    </div>

                    {/* Nhóm 7: Túi Đồ (Inventory) */}
                    <div className="space-y-6 col-span-full">
                       <h3 className={`text-lg font-bold ${theme.textPrimary} border-l-4 border-current pl-4 flex items-center justify-between`}>
                         <div className="flex items-center gap-2"><MapPin className="w-5 h-5" /> TÚI ĐỒ (INVENTORY)</div>
                         <button 
                           onClick={() => {
                             const newInv = [...(Array.isArray(mcData.inventory) ? mcData.inventory : [])];
                             newInv.push({ name: '', quantity: 1, description: '' });
                             setMcData({...mcData, inventory: newInv});
                           }}
                           className={`text-sm flex items-center gap-1 font-normal p-1 px-3 rounded-lg border cursor-pointer transition-colors ${theme.group === 'Dark' ? 'border-white/10 hover:bg-white/10 text-white/80 hover:text-white' : 'border-black/10 hover:bg-black/5 text-[#334155]'}`}
                         >
                           <Plus className="w-4 h-4" /> Thêm vật phẩm
                         </button>
                       </h3>
                       <div className="grid grid-cols-1 gap-4">
                         {Array.isArray(mcData.inventory) && mcData.inventory.map((item, i) => (
                           <div key={i} className={`p-4 rounded-xl border flex gap-4 ${theme.group === 'Dark' ? 'bg-white/5 border-white/10' : 'bg-white/80 border-black/10 shadow-sm'}`}>
                             <div className="flex-1 space-y-3">
                               <div className="flex gap-4">
                                 <div className="flex-[2]">
                                   <CharacterInput 
                                     label="Tên vật phẩm" 
                                     value={item.name} 
                                     onChange={(val) => {
                                       const newInv = [...mcData.inventory];
                                       newInv[i] = { ...newInv[i], name: val };
                                       setMcData({ ...mcData, inventory: newInv });
                                     }} 
                                   />
                                 </div>
                                 <div className="flex-1">
                                   <CharacterInput 
                                     label="Số lượng" 
                                     value={String(item.quantity)} 
                                     onChange={(val) => {
                                       const newInv = [...mcData.inventory];
                                       newInv[i] = { ...newInv[i], quantity: Number(val) || 1 };
                                       setMcData({ ...mcData, inventory: newInv });
                                     }} 
                                   />
                                 </div>
                               </div>
                               <CharacterTextArea 
                                 label="Mô tả công năng / Đặc điểm" 
                                 value={item.description} 
                                 onChange={(val) => {
                                   const newInv = [...mcData.inventory];
                                   newInv[i] = { ...newInv[i], description: val };
                                   setMcData({ ...mcData, inventory: newInv });
                                 }} 
                               />
                             </div>
                             <button
                               onClick={() => {
                                 const newInv = mcData.inventory.filter((_, idx) => idx !== i);
                                 setMcData({ ...mcData, inventory: newInv });
                               }}
                               className="p-2 self-start rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer mt-4"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         ))}
                         {(!Array.isArray(mcData.inventory) || mcData.inventory.length === 0) && (
                           <div className={`p-6 text-center rounded-xl border border-dashed ${theme.group === 'Dark' ? 'border-white/20 text-white/40' : 'border-black/10 text-[#334155]/60'}`}>
                             Hiện tại túi đồ đang trống.
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'npc' && (
                <div className="space-y-12">
                  {npcs.map((npc, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-8 rounded-[3rem] bg-white/5 border border-white/10 relative group shadow-2xl"
                    >
                      <button 
                        onClick={() => setNpcs(npcs.filter((_, i) => i !== idx))}
                        className="absolute top-6 right-6 p-3 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer z-10"
                        title="Xóa NPC"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      <div className="space-y-10">
                        {/* Định danh nhanh */}
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                               <div className="flex items-center justify-between">
                                  <label className={`text-xs font-black uppercase tracking-[0.2em] ${theme.textSecondary}`}>Tên hiển thị & Vai trò</label>
                                  <button onClick={() => toggleNpc(idx)} className={`${theme.textSecondary} hover:text-white transition-colors cursor-pointer mr-12`}>
                                     {collapsedNpcs[idx] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                  </button>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <CharacterTextArea
                                    label=""
                                    placeholder="Tên gọi nhanh (Ví dụ: Elena)"
                                    value={npc.name}
                                    onChange={(val) => {
                                      const newNpcs = [...npcs];
                                      newNpcs[idx] = { ...newNpcs[idx], name: val };
                                      setNpcs(newNpcs);
                                    }}
                                    variant="npc-header"
                                  />
                                  <CharacterTextArea
                                    label=""
                                    placeholder="Vai trò (Người hướng dẫn, Đối thủ...)"
                                    value={npc.role}
                                    onChange={(val) => {
                                      const newNpcs = [...npcs];
                                      newNpcs[idx] = { ...newNpcs[idx], role: val };
                                      setNpcs(newNpcs);
                                    }}
                                    variant="npc-header"
                                  />
                               </div>
                            </div>
                        </div>

                        {/* Chi tiết mở rộng */}
                        <AnimatePresence initial={false}>
                        {!collapsedNpcs[idx] && (
                        <motion.div 
                          className="grid grid-cols-1 gap-8 overflow-hidden"
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: "auto", opacity: 1, marginTop: "2rem" }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        >
                          {/* Nhóm 1: Định danh chi tiết */}
                          <div className="space-y-4">
                             <h4 className={`text-sm font-bold ${theme.textSecondary} flex items-center gap-2 opacity-70`}>
                               <User className="w-4 h-4" /> CHI TIẾT ĐỊNH DANH
                             </h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <CharacterInput label="HỌ VÀ TÊN" value={npc.fullName} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], fullName: val }; setNpcs(n); }} />
                                <CharacterInput label="DANH XƯNG (TƯỚC HIỆU)" value={npc.titles} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], titles: val }; setNpcs(n); }} />
                                <CharacterInput label="CHỨC VỤ (NGHỀ NGHIỆP)" value={npc.occupation} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], occupation: val }; setNpcs(n); }} />
                                <CharacterInput label="GIỚI TÍNH" value={npc.gender} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], gender: val }; setNpcs(n); }} />
                                <CharacterInput label="TUỔI TÁC" value={npc.age} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], age: val }; setNpcs(n); }} />
                                <CharacterInput label="NGÀY THÁNG NĂM SINH" value={npc.dob} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], dob: val }; setNpcs(n); }} />
                                <CharacterInput label="CẢNH GIỚI / CẤP ĐỘ" value={npc.rank} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], rank: val }; setNpcs(n); }} />
                             </div>
                          </div>

                          {/* Nhóm 2: Hình thể */}
                          <div className="space-y-4">
                             <h4 className={`text-sm font-bold ${theme.textSecondary} flex items-center gap-2 opacity-70`}>
                               <Sparkles className="w-4 h-4" /> ĐẶC TRƯNG HÌNH THỂ
                             </h4>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <CharacterInput label="CHIỀU CAO" value={npc.height} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], height: val }; setNpcs(n); }} />
                                <CharacterInput label="CÂN NẶNG" value={npc.weight} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], weight: val }; setNpcs(n); }} />
                                <CharacterInput label="SỐ ĐO 3 VÒNG" value={npc.measurements} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], measurements: val }; setNpcs(n); }} />
                             </div>
                             <CharacterTextArea label="MIÊU TẢ NGOẠI HÌNH TỔNG QUAN" value={npc.appearance} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], appearance: val }; setNpcs(n); }} />
                             <CharacterTextArea label="ĐẶC ĐIỂM NHẬN DẠNG PHỤ" value={npc.distinguishingFeatures} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], distinguishingFeatures: val }; setNpcs(n); }} />
                          </div>

                          {/* Nhóm 3: Năng lực & Tính cách */}
                          <div className="space-y-4">
                             <h4 className={`text-sm font-bold ${theme.textSecondary} flex items-center gap-2 opacity-70`}>
                               <BrainCircuit className="w-4 h-4" /> NĂNG LỰC & TÍNH CÁCH
                             </h4>
                             <div className="grid grid-cols-1 gap-4 mb-4">
                               <ArrayItemEditor itemLabel="Năng Lực" label="NĂNG LỰC / SỨC MẠNH" items={npc.powers} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], powers: val }; setNpcs(n); }} />
                               <ArrayItemEditor itemLabel="Kỹ Năng" label="KỸ NĂNG CHUYÊN MÔN" items={npc.skills} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], skills: val }; setNpcs(n); }} />
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CharacterTextArea label="TÍNH CÁCH TỔNG QUAN" value={npc.personality} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], personality: val }; setNpcs(n); }} />
                                <CharacterTextArea label="TÍNH CÁCH CỐT LÕI (BẢN NGÃ)" value={npc.personalityCore} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], personalityCore: val }; setNpcs(n); }} />
                                <CharacterTextArea label="KIM CHỈ NAM / LÝ TƯỞNG" value={npc.philosophy} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], philosophy: val }; setNpcs(n); }} />
                                <CharacterTextArea label="MỤC TIÊU TỐI THƯỢNG" value={npc.goal} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], goal: val }; setNpcs(n); }} />
                             </div>
                          </div>

                          {/* Nhóm 4: Hoàn cảnh & Nội tâm */}
                          <div className="space-y-4">
                             <h4 className={`text-sm font-bold ${theme.textSecondary} flex items-center gap-2 opacity-70`}>
                               <Shield className="w-4 h-4" /> HOÀN CẢNH & NỘI TÂM
                             </h4>
                             <CharacterTextArea label="NGUỒN GỐC / XUẤT THÂN / HOÀN CẢNH" value={npc.background} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], background: val }; setNpcs(n); }} />
                             <CharacterTextArea label="NỘI TÂM / SUY NGHĨ THẦM KÍN / ĐỘNG CƠ ẨN" value={npc.innerSecret} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], innerSecret: val }; setNpcs(n); }} />
                             <RelationshipArrayEditor label="TỔNG QUAN CÁC QUAN HỆ" items={npc.relationships} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], relationships: val }; setNpcs(n); }} />
                          </div>

                           {/* Nhóm 5: Quan hệ & NSFW */}
                           <div className="space-y-4">
                             <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2 opacity-70">
                               <Zap className="w-4 h-4" /> NSFW
                             </h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CharacterTextArea label="QUAN NIỆM VỀ TÌNH YÊU & TÌNH DỤC" value={npc.loveViews} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], loveViews: val }; setNpcs(n); }} />
                                <CharacterTextArea label="TRINH TIẾT VÀ KINH NGHIỆM NSFW" value={npc.experience} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], experience: val }; setNpcs(n); }} />
                                <CharacterTextArea label="TÍNH CÁCH KHI NSFW" value={npc.nsfwPersonality} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], nsfwPersonality: val }; setNpcs(n); }} />
                                <CharacterTextArea label="PHẢN ỨNG ĐẶC TRƯNG (NSFW)" value={npc.nsfwReactions} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], nsfwReactions: val }; setNpcs(n); }} />
                             </div>
                          </div>

                          {/* Nhóm 5: Tác phẩm */}
                          <div className="space-y-4">
                             <h4 className={`text-sm font-bold ${theme.textSecondary} flex items-center gap-2 opacity-70`}>
                               <Terminal className="w-4 h-4" /> MIÊU TẢ VĂN HỌC
                             </h4>
                             <CharacterTextArea label="MIÊU TẢ BẰNG NGÔN TỪ VĂN HỌC" value={npc.literaryDescription} onChange={(val) => { const n = [...npcs]; n[idx] = { ...n[idx], literaryDescription: val }; setNpcs(n); }} rows={6} />
                          </div>
                        </motion.div>
                        )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                  <button 
                    onClick={() => setNpcs([...npcs, { 
                      name: '', fullName: '', titles: '', occupation: '', gender: '', age: '', dob: '', height: '', weight: '', measurements: '', appearance: '', background: '', rank: '', powers: [], skills: [], role: '', personality: '', personalityCore: '', philosophy: '', distinguishingFeatures: '', innerSecret: '', relationships: [], loveViews: '', experience: '', nsfwPersonality: '', nsfwReactions: '', literaryDescription: '', goal: ''
                    }])}
                    className="w-full py-8 rounded-[2rem] border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 transition-all flex items-center justify-center gap-3 text-white/50 hover:text-white cursor-pointer group"
                  >
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" /> 
                    <span className="font-bold uppercase tracking-widest text-sm">Triệu hồi NPC mới</span>
                  </button>
                </div>
              )}

              {activeTab === 'items' && (
                <div className="space-y-8">
                  <section className="space-y-4">
                    <CharacterTextArea 
                      label="ĐỊA ĐIỂM (LOCATION)"
                      value={worldDetails.places}
                      onChange={(val) => setWorldDetails({...worldDetails, places: val})}
                      placeholder="Mô tả chi tiết các phòng ban, khu vực nhỏ lẻ, môi trường, và địa hình cụ thể..."
                    />
                  </section>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  </div>
</div>
  );
}

// Helper Components for Character Forms
function CharacterInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (val: string) => void, placeholder?: string }) {
  const theme = useStore(state => state.theme);
  const [localValue, setLocalValue] = React.useState(value);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [localValue]);

  return (
    <div className="space-y-2">
      <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${theme.group === 'Dark' ? 'text-white/40' : 'text-slate-500'}`}>{label}</label>
      <textarea
        ref={textareaRef}
        rows={1}
        value={typeof localValue === 'string' ? localValue.replace(/<br\s*\/?>/gi, '\n') : localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => { if(localValue !== value) onChange(localValue); }}
        placeholder={placeholder}
        className="w-full theme-input px-4 py-3 rounded-xl transition-all font-medium resize-none overflow-hidden"
      />
    </div>
  );
}

function CharacterTextArea({ 
  label, 
  value, 
  onChange, 
  rows = 1, 
  placeholder = "", 
  variant = "default" 
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void; 
  rows?: number;
  placeholder?: string;
  variant?: "default" | "large" | "title" | "npc-header"
}) {
  const theme = useStore(state => state.theme);
  const [localValue, setLocalValue] = React.useState(value);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [localValue]);

  const getVariantStyles = () => {
    switch (variant) {
      case "large":
        return "px-8 py-6 rounded-[2rem] text-lg min-h-[120px]";
      case "title":
        return "px-8 py-6 rounded-[2rem] text-2xl font-bold shadow-inner";
      case "npc-header":
        return "px-6 py-4 rounded-2xl text-lg font-bold min-h-[60px]";
      default:
        return "px-6 py-4 rounded-2xl text-sm min-h-[80px]";
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${theme.group === 'Dark' ? 'text-white/40' : 'text-slate-500'}`}>{label}</label>}
      <textarea
        ref={textareaRef}
        value={typeof localValue === 'string' ? localValue.replace(/<br\s*\/?>/gi, '\n') : localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => { if(localValue !== value) onChange(localValue); }}
        rows={rows}
        placeholder={placeholder}
        className={`w-full theme-input transition-all resize-none font-medium leading-relaxed overflow-hidden scrollbar-hide ${getVariantStyles()}`}
      />
    </div>
  );
}

function ArrayItemEditor({
  label,
  items,
  onChange,
  itemLabel = "Item"
}: {
  label: string;
  items: Array<any>;
  onChange: (val: Array<any>) => void;
  itemLabel?: string;
}) {
  const theme = useStore(state => state.theme);
  const arr = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-2">
      {label && <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${theme.group === 'Dark' ? 'text-white/40' : 'text-slate-500'}`}>{label}</label>}
      <div className="space-y-4">
        {arr.map((item, i) => (
          <div key={i} className={`p-4 rounded-xl border flex flex-col gap-3 ${theme.group === 'Dark' ? 'bg-white/5 border-white/10' : 'bg-white/80 border-black/10 shadow-sm'}`}>
            <div className="flex gap-3">
              <div className="flex-[2]">
                <CharacterInput label={`Tên ${itemLabel}`} value={item.name || ''} onChange={(val) => {
                  const newArr = [...arr];
                  newArr[i] = { ...newArr[i], name: val };
                  onChange(newArr);
                }} />
              </div>
              <div className="flex-1">
                 <CharacterInput label="Loại" value={item.type || ''} onChange={(val) => {
                  const newArr = [...arr];
                  newArr[i] = { ...newArr[i], type: val };
                  onChange(newArr);
                }} />
              </div>
              <div className="flex-1">
                 <CharacterInput label="Cấp độ" value={item.level || ''} onChange={(val) => {
                  const newArr = [...arr];
                  newArr[i] = { ...newArr[i], level: val };
                  onChange(newArr);
                }} />
              </div>
            </div>
            <CharacterTextArea label="Mô tả chi tiết" value={item.description || ''} onChange={(val) => {
                const newArr = [...arr];
                newArr[i] = { ...newArr[i], description: val };
                onChange(newArr);
            }} />
            <button
               onClick={() => {
                 const newArr = arr.filter((_, idx) => idx !== i);
                 onChange(newArr);
               }}
               className="px-3 py-1.5 self-start rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer text-xs font-bold"
             >
               Xóa
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const newArr = [...arr, { name: '', description: '', type: '', level: '' }];
            onChange(newArr);
          }}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${theme.group === 'Dark' ? 'border-white/20 hover:bg-white/10 text-white/70' : 'border-black/10 hover:bg-black/5 text-[#334155]'} cursor-pointer`}
        >
          + Thêm {itemLabel}
        </button>
      </div>
    </div>
  );
}

function RelationshipArrayEditor({
  label,
  items,
  onChange
}: {
  label: string;
  items: Array<any>;
  onChange: (val: Array<any>) => void;
}) {
  const theme = useStore(state => state.theme);
  const arr = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-2">
      {label && <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${theme.group === 'Dark' ? 'text-white/40' : 'text-slate-500'}`}>{label}</label>}
      <div className="space-y-4">
        {arr.map((item, i) => (
          <div key={i} className={`p-4 rounded-xl border flex flex-col gap-3 ${theme.group === 'Dark' ? 'bg-white/5 border-white/10' : 'bg-white/80 border-black/10 shadow-sm'}`}>
            <div className="flex gap-3">
              <div className="flex-[2]">
                <CharacterInput label="Tên nhân vật" value={item.name || ''} onChange={(val) => {
                  const newArr = [...arr];
                  newArr[i] = { ...newArr[i], name: val };
                  onChange(newArr);
                }} />
              </div>
              <div className="flex-1">
                 <CharacterInput label="Mối quan hệ" value={item.relation || ''} onChange={(val) => {
                  const newArr = [...arr];
                  newArr[i] = { ...newArr[i], relation: val };
                  onChange(newArr);
                }} />
              </div>
              <div className="flex-1">
                 <CharacterInput label="Tình cảm" value={item.status || ''} onChange={(val) => {
                  const newArr = [...arr];
                  newArr[i] = { ...newArr[i], status: val };
                  onChange(newArr);
                }} />
              </div>
            </div>
            <CharacterTextArea label="Mô tả chi tiết" value={item.description || ''} onChange={(val) => {
                const newArr = [...arr];
                newArr[i] = { ...newArr[i], description: val };
                onChange(newArr);
            }} />
            <button
               onClick={() => {
                 const newArr = arr.filter((_, idx) => idx !== i);
                 onChange(newArr);
               }}
               className="px-3 py-1.5 self-start rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer text-xs font-bold"
             >
               Xóa
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const newArr = [...arr, { name: '', relation: '', status: '', description: '' }];
            onChange(newArr);
          }}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${theme.group === 'Dark' ? 'border-white/20 hover:bg-white/10 text-white/70' : 'border-black/10 hover:bg-black/5 text-[#334155]'} cursor-pointer`}
        >
          + Thêm Mối Quan Hệ
        </button>
      </div>
    </div>
  );
}
