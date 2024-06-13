import fs from 'fs';

class Weber {
    static Compile(path:string) {
        let compiler = new WeberCompiler(fs.readFileSync(path).toString());
    } 
}

/**weber 코드를 HTML로 변환해주는 컴파일러 */
class WeberCompiler {
    weber_code:string;
    constructor(code:string) {
        
    }
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
    Propertys:Property[];
    Styles:Style[];
    Javascript:string[];
    Event = new Map<string,string[]>();
    Id:string|null = null;
    
    override ToString(content:ContentManager): string {
        //아이디 존재여부 확인 및 생성
        this.Id ??= content.CreateID();

        //스타일 추가
        content.Style_Manager.Add('#'+this.Id, this.Styles);
        //자바스크립트 추가
        this.Event.forEach((v,k) => {
            content.JS_Manager.Add(v);
        });

        //문자열로 변환
        if (this.Value == null) {
            return `<${this.Name}/>`
        }
        return `<${this.Name}>${this.Value??""}</${this.Name}>`;
    }
}