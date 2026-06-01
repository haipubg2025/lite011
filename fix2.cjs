const fs = require('fs');
let s = fs.readFileSync('src/components/WorldCreation.tsx','utf8');
const p1 = s.indexOf('      const prompt = `Ý tưởng người chơi cung cấp:');
const p2 = s.indexOf('      const result = aiService.generateStreamingContent(prompt, undefined, systemInstruction);', p1);

if(p1 !== -1 && p2 !== -1) {
    let newPrompt = "const prompt = `Ý tưởng người chơi cung cấp:\n" +
"- Ý tưởng sơ khai: \"${initialIdea}\"\n" +
"- Ý tưởng đã phát triển: \"${developedIdea}\"\n" +
"\n" +
"Dưới đây là các thông tin người chơi ĐÃ ĐIỀN (hãy giữ nguyên các thông tin này, không được thay đổi):\n" +
"\\`\\`\\`json\n" +
"{\n" +
"  \"worldData\": ${JSON.stringify(worldData)},\n" +
"  \"mcData\": ${JSON.stringify(mcData)},\n" +
"  \"npcs\": ${JSON.stringify(npcs)},\n" +
"  \"worldDetails\": ${JSON.stringify(worldDetails)}\n" +
"}\n" +
"\\`\\`\\`\n" +
"\n" +
"Dữ liệu trả về PHẢI là một object JSON duy nhất với cấu trúc chính xác sau:\n" +
"{\n" +
"  \"worldData\": { \n" +
"    \"name\": \"Tên thế giới\", \n" +
"    \"background\": \"Bối cảnh thế giới chi tiết\", \n" +
"    \"starterTimeline\": \"Mốc thời gian mở đầu cụ thể\", \n" +
"    \"starterScenario\": \"Kịch bản mở đầu lôi cuốn\", \n" +
"    \"worldRules\": \"Quy tắc, luật lệ, cấm kỵ của thế giới\",\n" +
"    \"namingConventions\": \"Quy tắc đặt tên cho nhân vật, địa danh, vật phẩm (Ví dụ: phong cách Nhật Bản trung cổ, Cyberpunk, v.v.)\",\n" +
"    \"genre\": \"Thể loại\",\n" +
"    \"mainMood\": \"Âm hưởng chủ đạo (Main Mood & Aesthetic)\",\n" +
"    \"pacing\": \"Nhịp độ (Pacing)\",\n" +
"    \"geography\": \"Địa lý & Vùng lãnh thổ\",\n" +
"    \"worldHistory\": \"Lịch sử thế giới\",\n" +
"    \"culture\": \"Văn hóa & Phong tục\",\n" +
"    \"economy\": \"Kinh tế & Xã hội\",\n" +
"    \"religion\": \"Tôn giáo & Tín ngưỡng\",\n" +
"    \"factions\": \"Các quốc gia & Thế lực\",\n" +
"    \"factionRelations\": \"Mối quan hệ thế lực\",\n" +
"    \"uniqueElements\": \"Các yếu tố độc đáo\",\n" +
"    \"powerSystem\": \"Hệ thống sức mạnh / Logic phân bậc\",\n" +
"    \"logicControl\": \"Kiểm soát Logic & Yếu tố loại trừ\",\n" +
"    \"writingStyle\": \"Văn Phong\",\n" +
"    \"narrativePerspective\": \"Ngôi Kể\"\n" +
"  },\n" +
"  \"mcData\": {\n" +
"    \"name\": \"Tên gọi\", \n" +
"    \"fullName\": \"Họ và Tên đầy đủ\", \n" +
"    \"titles\": \"Danh xưng, Tước hiệu\", \n" +
"    \"occupation\": \"Chức vụ, Nghề nghiệp\", \n" +
"    \"gender\": \"Giới tính\", \n" +
"    \"age\": \"Tuổi tác\", \n" +
"    \"dob\": \"Ngày tháng năm sinh\", \n" +
"    \"rank\": \"Cấu trúc Cảnh giới hoặc Chỉ số\", \n" +
"    \"height\": \"Chiều cao\", \n" +
"    \"weight\": \"Cân nặng\", \n" +
"    \"measurements\": \"Số đo 3 vòng (Nữ) / Thể hình (Nam)\", \n" +
"    \"appearance\": \"Miêu tả ngoại hình bẩm sinh\", \n" +
"    \"distinguishingFeatures\": \"Đặc trưng nhận diện phụ\", \n" +
"    \"powers\": \"Năng lực, Sức mạnh bẩm sinh\", \n" +
"    \"skills\": \"Kỹ năng chuyên môn\", \n" +
"    \"personality\": \"Tính cách tổng quan bên ngoài\", \n" +
"    \"personalityCore\": \"Bản ngã cốt lõi tận cùng của tâm hồn\", \n" +
"    \"philosophy\": \"Triết lý sống, tín ngưỡng cá nhân\", \n" +
"    \"goal\": \"Mục tiêu tối thượng\", \n" +
"    \"background\": \"Nguồn gốc, Xuất thân, Hoàn cảnh khởi đầu\", \n" +
"    \"innerSecret\": \"Những bí mật sâu kín\", \n" +
"    \"relationships\": \"Tổng quan các quan hệ xung quanh\", \n" +
"    \"loveViews\": \"Quan niệm về ái tình, sự chung thủy, tình dục\", \n" +
"    \"experience\": \"Kinh nghiệm tình trường (trinh tiết, thủ thân hay từng trải)\", \n" +
"    \"nsfwPersonality\": \"Bản chất khi NSFW (dâm đãng, thẹn thùng, thống trị, phục tùng)\", \n" +
"    \"nsfwReactions\": \"Phản ứng cơ thể, tiếng rên, nét mặt khi bị kích thích\", \n" +
"    \"literaryDescription\": \"Đoạn văn văn học khắc họa chân dung khởi đầu hoàn chỉnh cúa MC\"\n" +
"  },\n" +
"  \"npcs\": [{\n" +
"    \"name\": \"Tên NPC\", \n" +
"    \"fullName\": \"Họ và tên NPC\", \n" +
"    \"titles\": \"Danh xưng, Tước hiệu\", \n" +
"    \"occupation\": \"Chức vụ, Vai trò\", \n" +
"    \"gender\": \"Giới tính\", \n" +
"    \"age\": \"Tuổi tác\", \n" +
"    \"dob\": \"Ngày tháng năm sinh\", \n" +
"    \"rank\": \"Cảnh giới, Cấp độ\", \n" +
"    \"height\": \"Chiều cao\", \n" +
"    \"weight\": \"Cân nặng\", \n" +
"    \"measurements\": \"Số đo hình thể\", \n" +
"    \"appearance\": \"Miêu tả ngoại hình tổng quan (vô cùng chi tiết với nữ giới)\", \n" +
"    \"powers\": \"Năng lực sức mạnh\", \n" +
"    \"skills\": \"Kỹ năng\", \n" +
"    \"personality\": \"Tính cách tổng quan\", \n" +
"    \"personalityCore\": \"Bản ngã cốt lõi tận cùng của tâm hồn\", \n" +
"    \"philosophy\": \"Triết lý sống, tín ngưỡng cá nhân\", \n" +
"    \"goal\": \"Mục tiêu đời người NPC đang theo đuổi\", \n" +
"    \"distinguishingFeatures\": \"Đặc trưng nhận diện phụ (nốt ruồi, sẹo, cách nói chuyện)\", \n" +
"    \"innerSecret\": \"Những bí mật sâu kín NPC che giấu\", \n" +
"    \"relationships\": \"Tổng quan bạn bè, người thân, đồng minh (ngoài MC)\", \n" +
"    \"loveViews\": \"Quan điểm về ái tình, sự chung thủy, tình dục\", \n" +
"    \"experience\": \"Kinh nghiệm tình trường (trinh tiết, thủ thân hay từng trải, bạo dạn)\", \n" +
"    \"nsfwPersonality\": \"Bản chất khi NSFW (dâm đãng, thẹn thùng, thống trị, phục tùng)\", \n" +
"    \"nsfwReactions\": \"Phản ứng cơ thể, tiếng rên, nét mặt khi bị kích thích\", \n" +
"    \"literaryDescription\": \"Đoạn văn văn học khắc họa chân dung NPC và ngầm lồng ghép trang bị/vật phẩm họ mang theo\"\n" +
"  }],\n" +
"  \"worldDetails\": { \"places\": \"Mô tả chi tiết các địa điểm quan trọng hoặc những nơi các nhân vật sẽ xuất hiện hoặc đi đến bước đầu\" }\n" +
"}`;\n\n";

    s = s.substring(0, p1) + newPrompt + s.substring(p2);
    
    // Also inject the assignments
    const jsonParseMatch = 'const data = JSON.parse(rawJson);\n';
    const jsonParseIdx = s.indexOf(jsonParseMatch);
    if(jsonParseIdx !== -1) {
        const replaceString = 'const data = JSON.parse(rawJson);\n          if (data.worldData) setWorldData(data.worldData);\n          if (data.mcData) setMcData(data.mcData);\n          if (data.npcs) setNpcs(data.npcs);\n          if (data.worldDetails) setWorldDetails(data.worldDetails);\n';
        const endOfBlock = s.indexOf('toast.success(', jsonParseIdx);
        s = s.substring(0, jsonParseIdx) + replaceString + '          ' + s.substring(endOfBlock);
    }
    fs.writeFileSync('src/components/WorldCreation.tsx', s);
    console.log("Fixed!");
} else {
    console.log("Could not find boundaries.");
}
