import { readFileSync } from "fs";
import { arrayBuffer } from "stream/consumers";

class Weber {
    static Compile(path:string):string {
        let compiler = new WeberCompiler(readFileSync(path).toString());
        return compiler.Run();
    }
}

/**weber 코드를 HTML로 변환해주는 컴파일러 */
class WeberCompiler {
    weber_code:string;
    content = new ContentManager();
    constructor(code:string) {
        this.weber_code = code.trim();
    }
    Run():string {
        return this.#Parsing().ToString(this.content);
    }
    #Now() {
        if (this.#index >= this.weber_code.length) {
            throw this.#Error("요소의 끝이 존재하지 않습니다.");
        }
        return this.weber_code[this.#index];
    }
    #index = 0;
    #Parsing() : Tag {
        let html = new Tag("html");
        this.#index = 0;

        return html;
    }
    #Parser() : Tag|Property|Style {
        //이름 가져오기
        let name:string = (() => {
            let start = this.#index
            //더이상 특수문자가 없을때까지 index 증가
            while(!WeberCompiler.Special_Character.has(this.#Now())) {
                ++this.#index;
            }
            return this.weber_code.substring(start,this.#index);
        })();
        //띄어쓰기는 모두 스킵
        this.#SkipSpace();
        //만약 쌍점이라면, 간결한 태그 생성
        if (this.#Now() == ":") {
            this.#index++;
            return new Tag(name,this.#Text());
        }
        //중괄호라면, 일단 태그는 맞음 와 귀차나..
        // (나중에 구현하자...)
        
        // 그것도 아니라면, 아마 속성임. 그냥 있는 그대로 가져오자
        return new Property(name,this.#ReadLine());
    }
    /** 텍스트 읽기 */
    #Text() : string {
        this.#SkipSpace();
        let text = "";
        const open = this.#Now();
        //큰따옴표, 작은따옴표 둘다 아니라면... 뭐냐?
        if (open != "'" && open != '"') {
            throw this.#Error("문자열은 따옴표로 양옆을 감싸야 합니다.");
        }
        //다시 닫힐때까지 파싱
        for(this.#index++;this.#Now() != open;this.#index++) {
            if (this.#Now() == '\n') {
                throw this.#Error("문자열은 따옴표로 끝나야만 합니다.");
            }
            if (this.#Now() == '\\') {
                this.#index++;
                if (this.#Now() == 'n') {
                    text += '\n';
                    continue;
                }
            }
            text += this.#Now();
        }
        //끝
        return text;
    }
    /**다음 줄바꿈까지 그대로 읽기 */
    #ReadLine() : string {
        let start = this.#index;
        while(this.#Now() != "\n") {
             this.#index++;
        }
        //줄바꿈과 마주쳤다면, 이제 끝
        return this.weber_code.substring(start,this.#index++-1);
    }
    /**오류 메시지 */
    #Error(message:string) : string {
        return `Weber Error. (${this.#index}번째 글자) ${message}`;
    }
    #SkipSpace() {
        while(this.#Now() == " ") this.#index++;
    }
    /**테스트 */
    Test() {
        console.log(this.#Parser());
    }
    /**존재하는 특수문자 */
    static Special_Character = new Set(Array.from("\n!@#$%^&*()_+\\-=[]{};':\"|,.<>/?'"));
    /** 존재하는 HTML 태그 목록 <태그명, 콘텐츠 포함 여부> */
    static HTML_Tag = new Map<string,boolean>([
        ["h1",true], ["h2",true], ["h3",true], ["h4",true], ["h5",true], ["h6",true],
        ["p",true], ["b",true], ["s",true], ["div",true],
        ["body",true], ["head",true],
        ["br",false], ["img",false]
    ]);
    /**존재하는 Style 태그 목록 */
    static Style_Option = new Map<string,boolean>([

    ]);
}

/**콘텐츠 관리자 */
class ContentManager {
    JS_Manager = new JavascriptManager();
    Style_Manager = new StyleManager();

    #index = 0;
    CreateID() : string {
        return `_weber_id_${this.#index++}_${Math.random().toString().replace('.','_')}`;
    }
}
/**자바스크립트 관리자 */
class JavascriptManager {
    js_code:string[] = [];
    #index = 0;
    /**자바스크립트 함수 이름 */
    CreateName() : string {
        return `_weber_function_${this.#index++}_${Math.random().toString().replace('.','_')}`;
    }
    Add(code:string[]) : string {
        //함수명 추가
        const name = this.CreateName();
        this.js_code.push(`function ${name}() {`,);
        //모든 소스코드 추가
        code.forEach(v => this.js_code.push(v));
        //함수 닫고, 함수명 리턴
        this.js_code.push('}');
        return name;
    }
}
/**스타일 관리자 */
class StyleManager {
    code = [];
    #index = 0;
    Add(name:string, styles:Style[]) {

    }
}
/**프로퍼티 (id, autoplay 등) */
class Property {
    Name:string;
    Value:string|null;

    constructor(Name:string, Value:string|null = null) {
        this.Name = Name;
        this.Value = Value;
    }

    ToString(content:ContentManager):string {
        if (this.Value == null) {
            return this.Name;
        }
        return `${this.Name}="${this.Value}"`;
    }
}
/**스타일 (font-size: 1rem; 등) */
class Style extends Property {
    override ToString(content:ContentManager): string {
        return `${this.Name} ${this.Value};`;
    }
}
/**HTML 태그 (h1,p,div 등) */
class Tag extends Property {
    Propertys:Property[] = [];
    Styles:Style[] = [];
    Javascript:string[] = [];
    Event = new Map<string,string[]>();
    Id:string|null = null;
    
    override ToString(content:ContentManager): string {
        //아이디 존재여부 확인 및 생성
        this.Id ??= content.CreateID();
        //스타일 추가
        content.Style_Manager.Add('#'+this.Id, this.Styles);
        //자바스크립트 추가
        this.Event.forEach((v,k) => { //v: 스크립트, k: 이벤트 이름
            let name = content.JS_Manager.Add(v);
            //해당 함수를 호출하는 이벤트 속성 추가
            this.Propertys.push(new Property(k,`${name}()`)); // onclick="_weber_function_0_()";
        });
        //문자열로 변환
        if (this.Value == null) {
            return `<${this.Name}/>`
        }
        return `<${this.Name}>${this.Value??""}</${this.Name}>`;
    }
}


//테스트
let test = new WeberCompiler("h4: 'hello\\n world!'\n");
test.Test();