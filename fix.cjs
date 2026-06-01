const fs = require('fs');
let s = fs.readFileSync('src/components/WorldCreation.tsx','utf8');
const searchStart = 'const prompt = `Ý tưởng người chơi cung cấp:';
const p1 = s.indexOf(searchStart);
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
"  \"worldDetails\": ${JSON.stringify(worldDetails)}\n" +
"}\n" +
"\\`\\`\\`\n" +
"\n" +
"Dữ liệu trả về PHẢI là một object JSON duy nhất với cấu trúc chính xác sau (Tuyệt đối KHÔNG tạo hay chỉnh sửa thông tin MC hay NPC):\n" +
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
"  \"worldDetails\": { \"places\": \"Mô tả chi tiết các địa điểm quan trọng hoặc những nơi các nhân vật sẽ xuất hiện hoặc đi đến bước đầu\" }\n" +
"}`;\n\n";

    s = s.substring(0, p1) + newPrompt + s.substring(p2);
    fs.writeFileSync('src/components/WorldCreation.tsx', s);
    console.log("Fixed!");
} else {
    console.log("Could not find boundaries.");
}
