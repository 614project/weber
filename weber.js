/* weber
 * 
 * 이 코드는 614project (깃허브 이름 기준) 가 js로 제작한
 * 새로운 컴파일러입니다.
 * 
 * 이것은 제가 따로 만든 weber 언어를 html 파일로 변환합니다.
 * 그것도 하나의 파일로 묶어서 변환합니다.
 * 
 * weber 에는 기존 html/css/js 의 복잡하고 난해한 코딩을 풀기위해
 * 만들어진 언어이자, 지금 보고 있는 이 코드는 컴파일러입니다.
 * 
 * weber 언어에는 x,y 좌표 개념을 도입하고
 * 여러 기능들 대신, 블록코딩 마냥 오브젝트와 글상자 개념을 도입해
 * 만들어진 언어입니다.
 * 
 * 이제 시작이라 잘 이해가 안가실수도 있지만
 * 지금 중요한건 아닙니다.
 * 
 * 나중에 어느정도 완성 될쯤 weber 언어에 대한 설명을 써놓으며
 * 배포할 예정..은 아니고요
 * 
 * 저 혼자 쓸껍니다 히히, 그러니까 꼬우면 이 소스코드 변형해서 쓰거나
 * 새로 만드세요.
 * 잘만들면 제가 weber 프로젝트 떄려치고 그걸로 쓸지도..?
*/

const weber = (text) => {
    //들어온 타입 검사
    if (!typeof (text) == "string") {
        if (!Array.isArray(text)) {
            console.error("문자열 이외에는 컴파일 할수 없습니다.");
            return;
        }
    } else {
        text = new Array(text);
    }
    //기본적인 변수
    stack = [];
    num = 0;
    //시작
    //while (num < text.length) {
    //
    //}
}