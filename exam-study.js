(() => {
    'use strict';

    const subjects = [
        {
            id:'communication', icon:'📡', short:'ระบบสื่อสาร', title:'ระบบสื่อสารภายในอาคาร', color:'#dcecff',
            memory:'จำเส้นทางข้อมูล + หน้าที่ห้อง',
            flow:['Internet / ISP','MDF','Fiber Backbone','IDF','สาย LAN','AP / Data Outlet','ผู้ใช้'],
            topics:[
                { title:'แกนกลางของระบบ', items:[
                    '<mark>MDF</mark> คือศูนย์กลางหลักของอาคาร มี Router, Firewall, Core Switch และ Server',
                    '<mark>IDF</mark> คือจุดกระจายสัญญาณประจำชั้นหรือโซน มี Switch, Patch Panel และ UPS',
                    'Backbone มักใช้ใยแก้วนำแสงเชื่อม MDF ไป IDF ส่วน Horizontal Cabling ใช้สาย LAN จาก IDF ไปยังจุดใช้งาน'
                ]},
                { title:'Wi‑Fi ที่ดีไม่ใช่แค่มีขีดสัญญาณ', items:[
                    'Wireless Coverage คือพื้นที่ที่สัญญาณมีคุณภาพพอใช้งานจริง ไม่ใช่เพียงมองเห็นชื่อเครือข่าย',
                    'คอนกรีต โลหะ กระจก Low‑E ลิฟต์ ห้องเครื่อง และชั้นวางสูง ทำให้สัญญาณอ่อนหรือเกิดจุดอับ',
                    'ต้องประสานตำแหน่ง AP กับผังห้อง วัสดุ ฝ้า เฟอร์นิเจอร์ และทางเข้าซ่อมบำรุง'
                ]},
                { title:'โทรศัพท์และการสื่อสารฉุกเฉิน', items:[
                    '<mark>VoIP</mark> แปลงเสียงเป็นข้อมูลดิจิทัล ส่งผ่านเครือข่าย แล้วแปลงกลับเป็นเสียง ใช้ IP Phone, Switch/Router, LAN/Wi‑Fi และ IP PBX',
                    'Emergency Phone ควรอยู่บริเวณลิฟต์ บันไดหนีไฟ ที่จอดรถ และทางออกฉุกเฉิน มองเห็นง่าย ไม่ถูกบัง และมีไฟสำรอง',
                    'อาจเชื่อมกับ Security, BMS, CCTV และ Fire Alarm เพื่อให้ช่วยเหลือได้เร็ว'
                ]},
                { title:'สิ่งที่อินทีเรียต้องเผื่อ', items:[
                    'ห้อง Rack/Telecom และ Server ต้องมีพื้นที่ ระบายอากาศ ระบบไฟและไฟสำรอง ความปลอดภัย และทางซ่อมบำรุง',
                    'กำหนด Data Outlet ให้สัมพันธ์กับโต๊ะ เคาน์เตอร์ ห้องประชุม และจุดบริการ เพราะย้ายภายหลังมีค่าใช้จ่ายสูง',
                    'วาง Cable Tray, Conduit, Wireway และ Shaft ไม่ให้ชนไฟฟ้า แอร์ สุขาภิบาล และงานฝ้า'
                ]}
            ]
        },
        {
            id:'security', icon:'🛡️', short:'รักษาความปลอดภัย', title:'ระบบรักษาความปลอดภัยภายในอาคาร', color:'#e8e1ff',
            memory:'CCTV = มองเห็น · Access = อนุญาต',
            flow:['กล้อง / Credential','สายสัญญาณ / Reader','Switch / Controller','NVR / Lock','บันทึก / เปิดประตู'],
            topics:[
                { title:'CCTV ทำงานอย่างไร', items:[
                    'เส้นทางหลักคือ Camera → LAN → PoE Switch → NVR → Hard Disk / Monitor / Mobile',
                    'DVR ใช้กับระบบ Analog ส่วน NVR ใช้กับกล้อง IP',
                    'Analog ราคาต่ำและระบบไม่ซับซ้อน ส่วน IP ดูและควบคุมผ่านเครือข่าย มีฟังก์ชันมากกว่า'
                ]},
                { title:'วางกล้องให้ตอบวัตถุประสงค์', items:[
                    'ถามก่อนว่า “ต้องเห็นหน้า” หรือ “ต้องเห็นพื้นที่” เพราะมุมกว้างเห็นพื้นที่มากแต่ใบหน้าเล็ก',
                    'ทางเข้าออกมักติดสูงประมาณ 2.5–3 เมตร ก้มราว 45° เลี่ยงย้อนแสงและสิ่งบัง',
                    'พื้นที่กว้างอาจใช้มุมกว้างที่ 3–4 เมตร พื้นที่มืดควรมี Night Vision/IR และห้ามติดในห้องน้ำ ห้องเปลี่ยนเสื้อผ้า หรือพื้นที่ส่วนตัว'
                ]},
                { title:'ลำดับ Access Control', items:[
                    'ผู้ใช้แสดง Card/Fingerprint/Face/Mobile → Reader → Controller ตรวจสิทธิ์ → Electric Lock เปิด → Door Contact ตรวจประตู → ปิดและล็อกใหม่',
                    'ส่วนหลักได้แก่ Reader, Controller, Electric Lock, Door Contact และ Exit Button',
                    'ระบบบันทึกว่าใคร เข้าเมื่อไร และเข้าพื้นที่ใด ช่วยตรวจสอบย้อนหลังได้'
                ]},
                { title:'เลือกกลอนและวิธีระบุตัวตน', items:[
                    'Magnetic Lock ไม่มีชิ้นส่วนกลไกและมักเป็น Fail‑safe คือไฟดับแล้วปลดล็อก',
                    'Electric Strike ใช้กับชุดลูกบิดหรือ Mortise, Drop Bolt เหมาะประตูเปิดสองทาง, Mortise Lock ให้ความปลอดภัยสูง',
                    'บัตรใช้ง่ายแต่หายได้, ลายนิ้วมืออาจมีปัญหาฝุ่น/น้ำ, ใบหน้ารวดเร็วไม่สัมผัส, Mobile ใช้ BLE/NFC และผูกกับอุปกรณ์'
                ]}
            ]
        },
        {
            id:'fireProtection', icon:'🧱', short:'ป้องกันอัคคีภัย', title:'ระบบป้องกันอัคคีภัย', color:'#ffe3dd',
            memory:'Passive กั้นไฟ · Active ตรวจและดับ',
            flow:['เชื้อเพลิง + ออกซิเจน + ความร้อน','เกิดเพลิง','ตรวจจับ / จำกัดพื้นที่','อพยพ','ระงับเหตุ'],
            topics:[
                { title:'พื้นฐานที่ต้องจำ', items:[
                    'สามเหลี่ยมไฟประกอบด้วย <mark>เชื้อเพลิง ออกซิเจน และความร้อน</mark> ตัดองค์ประกอบใดองค์ประกอบหนึ่งไฟจะดับ',
                    'เป้าหมายคือความปลอดภัยต่อชีวิต ทรัพย์สิน และความต่อเนื่องของธุรกิจ',
                    'ต้องพิจารณาประเภทอาคาร ผู้ใช้อาคาร กิจกรรม และช่วงเวลาที่ใช้งาน'
                ]},
                { title:'Passive กับ Active', items:[
                    '<mark>Passive</mark> จำกัดการลามของไฟและควัน เช่น โครงสร้างทนไฟ Compartment, Fire Door และ Firestop',
                    '<mark>Active</mark> ตรวจจับ แจ้งเตือน และระงับเหตุ เช่น Fire Alarm, Sprinkler และระบบก๊าซ',
                    'ทั้งสองระบบต้องทำงานร่วมกัน ไม่ใช่เลือกใช้เพียงระบบเดียว'
                ]},
                { title:'การแบ่งส่วนและทางหนีไฟ', items:[
                    'Compartmentation แบ่งพื้นที่ด้วยผนัง พื้น ประตู และช่องเปิดทนไฟ เพื่อกักไฟและให้เวลาอพยพ',
                    'ทางหนีแนวดิ่ง ได้แก่ บันไดหนีไฟและลิฟต์ดับเพลิง ส่วนแนวราบคือเคลื่อนไปพื้นที่ปลอดภัยข้างเคียงโดยไม่เปลี่ยนชั้น',
                    'Fire Door ต้องทนไฟ ปิดได้เอง และเปิดไปทางบันไดหนีไฟ ช่องทะลุผนัง/พื้นต้องอุดด้วย Firestop'
                ]},
                { title:'Fire Command Center', items:[
                    'ควรอยู่ชั้นล่างหรือชั้น 1 เข้าถึงง่ายและใกล้ลิฟต์ดับเพลิง ห้องมีอัตราทนไฟอย่างน้อย 2 ชั่วโมง',
                    'ภายในมี Fire Alarm Control Panel, โทรศัพท์นักดับเพลิง, ควบคุมระบายควัน อัดอากาศบันได ลิฟต์ฉุกเฉิน และระบบเชื่อมโยง',
                    'ต้องเตรียมทางรถดับเพลิง จุดรับน้ำ FDC ช่องเข้าถึงอาคาร และแหล่งน้ำสำหรับเจ้าหน้าที่'
                ]}
            ]
        },
        {
            id:'fireAlarm', icon:'🚨', short:'แจ้งเหตุและระงับไฟ', title:'ระบบแจ้งเหตุเพลิงไหม้และระงับอัคคีภัย', color:'#fff0cc',
            memory:'ตรวจจับ → แจ้งเตือน → ควบคุม → ระงับ',
            flow:['Heat / Smoke Detector','Control Panel','Bell / Strobe / Voice','Sprinkler / Agent','ควบคุมเพลิง'],
            topics:[
                { title:'Fire Alarm 3 ส่วน', items:[
                    'Detector ตรวจจับเหตุ เช่น Heat Detector และ Smoke Detector',
                    'Notification แจ้งเตือนแบบ Manual หรือ Automatic ผ่าน Bell, Siren, Strobe หรือ Voice',
                    'Control Panel รับและประมวลสัญญาณ แสดงตำแหน่ง และสั่งอุปกรณ์ที่เกี่ยวข้อง'
                ]},
                { title:'ระบบระงับอัคคีภัย', items:[
                    'ระงับไฟด้วยการลดความร้อน ลด/กั้นออกซิเจน หรือหยุดปฏิกิริยาลูกโซ่',
                    'ระบบหลักคือ Sprinkler, Gas/Chemical, Fire Water Piping และถังดับเพลิงแบบเคลื่อนย้ายได้',
                    'Pendant ใช้ทั่วไปใต้ฝ้า, Upright ใช้ในที่จอด/คลัง, Sidewall ใช้เมื่อข้อจำกัดการติดตั้งที่ผนัง'
                ]},
                { title:'น้ำ ก๊าซ และท่อ', items:[
                    'Clean Agent เช่น FM‑200, INERGEN และ Novec 1230 เหมาะห้องคอมพิวเตอร์หรืออุปกรณ์มูลค่าสูงเพราะไม่ทิ้งคราบ',
                    'Wet Pipe มีน้ำอยู่ในท่อตลอด ส่วน Dry Pipe รอเติมน้ำเมื่อระบบทำงาน เหมาะพื้นที่อากาศเย็นจัด',
                    'ระบบน้ำประกอบด้วยถังสำรอง Fire Pump, Standpipe, Fire Hose และ Fire Department Connection (FDC)'
                ]},
                { title:'ประเภทเพลิงและถังดับเพลิง', items:[
                    'A ของแข็ง เช่น ไม้/กระดาษ, B ของเหลวไวไฟ, C ไฟฟ้าที่ยังมีกระแส, D โลหะไวปฏิกิริยา, K น้ำมันทำอาหาร',
                    'น้ำเหมาะ Class A, Foam เหมาะ A/B, CO₂ เหมาะ B/C และอุปกรณ์ไฟฟ้าเพราะไม่ทิ้งคราบ',
                    'Dry Chemical ใช้ B/C ได้กว้างแต่ทิ้งผงและอาจทำอันตรายอุปกรณ์ ต้องเลือกตามพื้นที่ เชื้อเพลิง ผู้ใช้งาน มาตรฐาน งบ และการดูแลรักษา'
                ]}
            ]
        }
    ];

    const easyQuestionStarts = [
        'MDF และ IDF','โทรศัพท์ฉุกเฉิน','จงอธิบายลำดับการส่งภาพ','เปรียบเทียบหน้าที่ของ CCTV',
        'สามเหลี่ยมไฟ','ระบบป้องกันอัคคีภัยแบบ Passive','ระบบแจ้งเหตุเพลิงไหม้ประกอบด้วย',
        'Wet Pipe และ Dry Pipe','จงจำแนกประเภทเพลิง'
    ];
    const hardQuestionStarts = [
        'อธิบายหลักการทำงานของ VoIP','เพราะเหตุใดตำแหน่ง Data Outlet','อธิบายลำดับการทำงานของ Access Control',
        'Magnetic Lock','ทางหนีไฟแนวราบ','Fire Command Center','เมื่อใดควรใช้ระบบดับเพลิงด้วย Clean Agent',
        'ปัจจัยใดใช้เลือกระบบระงับอัคคีภัย'
    ];
    const difficultyFor = question => hardQuestionStarts.some(start=>question.startsWith(start)) ? 'hard' : easyQuestionStarts.some(start=>question.startsWith(start)) ? 'easy' : 'medium';
    const q = (subject, question, hint, answer, rubric) => ({subject,question,hint,answer,rubric,difficulty:difficultyFor(question)});
    const questionBank = [
        q('communication','จงอธิบายเส้นทางของสัญญาณอินเทอร์เน็ตตั้งแต่ผู้ให้บริการจนถึงอุปกรณ์ของผู้ใช้ในอาคาร','เริ่มจาก ISP แล้วไล่ผ่านห้องหลัก ห้องประจำชั้น และจุดปลายทาง','สัญญาณจาก ISP เข้าสู่ MDF ผ่าน Router และ Firewall ไปยัง Core Switch จากนั้นส่งผ่าน Fiber Backbone ไป IDF ของแต่ละชั้น แล้วกระจายด้วยสาย LAN ไปยัง Access Point หรือ Data Outlet ก่อนถึงอุปกรณ์ผู้ใช้',[['ISP / อินเทอร์เน็ต',['isp','อินเทอร์เน็ต','ผู้ให้บริการ']],['MDF และอุปกรณ์แกนกลาง',['mdf','router','firewall','core switch']],['Backbone และ IDF',['backbone','fiber','ใยแก้ว','idf']],['ปลายทางผู้ใช้',['lan','access point','ap','data outlet','ผู้ใช้']]]),
        q('communication','MDF และ IDF ต่างกันอย่างไร และแต่ละห้องควรมีอุปกรณ์ใด','คิดเป็น “ส่วนกลางของทั้งอาคาร” กับ “จุดกระจายประจำชั้น”','MDF เป็นศูนย์กลางหลักของอาคาร รับสัญญาณจาก ISP และมักมี Router, Firewall, Core Switch และ Server ส่วน IDF เป็นจุดกระจายของแต่ละชั้น/โซน มี Network Switch, Patch Panel และ UPS แล้วส่งสาย LAN ไปยังผู้ใช้',[['MDF ศูนย์กลางอาคาร',['mdf','ศูนย์กลาง','หลัก']],['Router/Firewall/Core Switch',['router','firewall','core switch']],['IDF ประจำชั้นหรือโซน',['idf','ชั้น','โซน']],['Switch/Patch Panel/UPS',['switch','patch panel','ups']]]),
        q('communication','Wireless Coverage หมายถึงอะไร และงานอินทีเรียใดทำให้เกิดจุดอับสัญญาณได้','แยกคำว่า “มีสัญญาณ” ออกจาก “ใช้งานได้ดี”','Wireless Coverage คือพื้นที่ที่สัญญาณไร้สายมีคุณภาพเพียงพอต่อการใช้งานจริง จุดอับอาจเกิดจากผนังคอนกรีต โลหะ กระจก Low‑E ลิฟต์ ห้องเครื่อง ชั้นวางสูง และตำแหน่ง AP ที่ถูกวัสดุหรือเฟอร์นิเจอร์บัง',[['คุณภาพใช้งานจริง',['คุณภาพ','ใช้งานจริง','เพียงพอ']],['คอนกรีต/ผนัง',['คอนกรีต','ผนัง']],['โลหะ/กระจก Low-E',['โลหะ','low-e','low e','กระจก']],['สิ่งบังหรือตำแหน่ง AP',['ap','บัง','ชั้นวาง','เฟอร์นิเจอร์','ลิฟต์','ห้องเครื่อง']]]),
        q('communication','อธิบายหลักการทำงานของ VoIP และสิ่งที่ต้องเตรียมในงานออกแบบภายใน','เสียงถูกเปลี่ยนเป็นอะไร แล้วต้องผ่านอุปกรณ์ใด','VoIP แปลงเสียงเป็นข้อมูลดิจิทัล ส่งผ่านเครือข่าย และแปลงกลับเป็นเสียง โดยใช้ IP Phone หรือ Softphone, LAN/Wi‑Fi, Switch/Router และ IP PBX งานอินทีเรียต้องเตรียม Data Outlet จุดไฟ ห้อง Rack และแนวเดินสายให้สัมพันธ์กับเฟอร์นิเจอร์',[['แปลงเสียงเป็นดิจิทัล',['ดิจิทัล','digital','แปลงเสียง']],['ส่งผ่านเครือข่าย',['เครือข่าย','network','lan','wi-fi','wifi']],['IP Phone/IP PBX',['ip phone','softphone','ip pbx']],['เตรียมจุดและทางสาย',['data outlet','จุดไฟ','rack','เดินสาย','เฟอร์นิเจอร์']]]),
        q('communication','โทรศัพท์ฉุกเฉินควรวางที่ใดและมีข้อกำหนดด้านการออกแบบอย่างไร','คิดถึงจุดที่คนติดค้างหรือขอความช่วยเหลือ','ควรวางใกล้ลิฟต์ บันไดหนีไฟ ที่จอดรถ และทางออกฉุกเฉิน ให้มองเห็นง่าย มีป้าย ไม่ถูกบัง กดใช้งานง่าย มีไฟสำรอง และอาจเชื่อมกับ Security, CCTV, BMS หรือ Fire Alarm',[['ตำแหน่งฉุกเฉิน',['ลิฟต์','บันไดหนีไฟ','ที่จอดรถ','ทางออกฉุกเฉิน']],['มองเห็นและไม่ถูกบัง',['มองเห็น','ป้าย','ไม่ถูกบัง','เข้าถึง']],['ไฟสำรอง',['ไฟสำรอง','ups','backup']],['เชื่อมระบบอื่น',['security','cctv','bms','fire alarm']]]),
        q('communication','เพราะเหตุใดตำแหน่ง Data Outlet และแนวเดินสายจึงต้องกำหนดตั้งแต่ช่วงออกแบบภายใน','เชื่อมโยงกับเฟอร์นิเจอร์ ฝ้า และค่าแก้ไขภายหลัง','Data Outlet ต้องตรงกับโต๊ะ เคาน์เตอร์ ห้องประชุม และจุดบริการ ส่วนแนวสายต้องประสานฝ้า Cable Tray/Conduit และระบบอาคารอื่น การย้ายหรือเพิ่มภายหลังทำให้รื้อวัสดุและมีค่าใช้จ่ายสูง',[['สัมพันธ์จุดใช้งาน/เฟอร์นิเจอร์',['โต๊ะ','เคาน์เตอร์','เฟอร์นิเจอร์','จุดใช้งาน','ห้องประชุม']],['ประสานฝ้า/แนวสาย',['ฝ้า','cable tray','conduit','แนวสาย']],['ไม่ชนระบบอื่น',['ไฟฟ้า','แอร์','สุขาภิบาล','ระบบอื่น','ชน']],['ลดรื้อและค่าใช้จ่าย',['รื้อ','ค่าใช้จ่าย','ภายหลัง','แพง']]]),

        q('security','จงอธิบายลำดับการส่งภาพของระบบ CCTV แบบ IP ตั้งแต่กล้องจนถึงผู้ดู','ไล่จากกล้อง สาย อุปกรณ์เครือข่าย เครื่องบันทึก และจอ','Camera ส่งข้อมูลผ่านสาย LAN ไป PoE Switch จากนั้นเข้าสู่ NVR เพื่อบันทึกลง Hard Disk และแสดงผ่าน Monitor หรือ Mobile โดยควรมี UPS สำรองไฟให้อุปกรณ์สำคัญ',[['Camera',['camera','กล้อง']],['LAN และ PoE Switch',['lan','poe','switch']],['NVR/Hard Disk',['nvr','hard disk','ฮาร์ดดิสก์','บันทึก']],['Monitor/Mobile',['monitor','จอ','mobile','มือถือ']]]),
        q('security','กล้อง Analog และ IP Camera แตกต่างกันอย่างไร','เทียบสื่อส่งสัญญาณ ความสามารถ และการดูระยะไกล','Analog ใช้สาย Coaxial ระบบง่ายและราคาต่ำกว่า แต่มักมีความละเอียด/ฟังก์ชันและความปลอดภัยน้อยกว่า ส่วน IP Camera ส่งข้อมูลผ่านเครือข่าย ดูและควบคุมระยะไกลได้ รองรับภาพ/เสียงและฟังก์ชันอัจฉริยะมากกว่า',[['Analog/Coaxial',['analog','coax','coaxial']],['ง่าย/ราคาต่ำ',['ง่าย','ราคาถูก','ราคาต่ำ']],['IP ผ่านเครือข่าย',['ip','เครือข่าย','network','lan']],['ดูระยะไกล/ฟังก์ชันมาก',['ระยะไกล','ควบคุม','ฟังก์ชัน','ภาพเสียง']]]),
        q('security','หลักการวางกล้องให้เห็นใบหน้าบริเวณทางเข้าออกมีอะไรบ้าง','นึกถึงความสูง มุม แสง และสิ่งกีดขวาง','กำหนดวัตถุประสงค์ให้เห็นใบหน้า ติดกล้องสูงประมาณ 2.5–3 เมตร ก้มราว 45 องศา หลีกเลี่ยงย้อนแสงจากประตู/หน้าต่าง ให้มีแสงพอและไม่ถูกโคมไฟ ต้นไม้ หรือป้ายบัง',[['เห็นใบหน้า/วัตถุประสงค์',['ใบหน้า','วัตถุประสงค์']],['สูง 2.5–3 เมตร',['2.5','3 เมตร','ความสูง']],['มุมก้มประมาณ 45°',['45','ก้ม','มุม']],['เลี่ยงย้อนแสงและสิ่งบัง',['ย้อนแสง','หน้าต่าง','ประตู','บัง','แสง']]]),
        q('security','อธิบายลำดับการทำงานของ Access Control ตั้งแต่ผู้ใช้ยืนยันตัวตนจนประตูกลับมาล็อก','มีอุปกรณ์ตรวจสิทธิ์ เปิดกลอน ตรวจสถานะ และล็อกใหม่','ผู้ใช้แสดงบัตร ลายนิ้วมือ ใบหน้า หรือมือถือที่ Reader จากนั้น Controller ตรวจสิทธิ์และสั่ง Electric Lock ปลดล็อก Door Contact ตรวจว่าประตูเปิด/ปิด และเมื่อตัวประตูปิดระบบจะล็อกกลับพร้อมบันทึกเหตุการณ์',[['Credential/Reader',['บัตร','ลายนิ้วมือ','ใบหน้า','มือถือ','reader']],['Controller ตรวจสิทธิ์',['controller','ตรวจสิทธิ์']],['Electric Lock ปลดล็อก',['electric lock','กลอน','ปลดล็อก']],['Door Contact และล็อกกลับ',['door contact','เปิดปิด','ล็อกกลับ','บันทึก']]]),
        q('security','Magnetic Lock, Electric Strike, Drop Bolt และ Mortise Lock เหมาะกับงานต่างกันอย่างไร','ไม่ต้องจำทุกประตู แต่บอกคุณสมบัติเด่นของอย่างน้อยสามชนิด','Magnetic Lock ใช้แรงแม่เหล็ก ไม่มีชิ้นส่วนกลไกและมักปลดเมื่อไฟดับ, Electric Strike ทำงานกับชุดลูกบิดหรือ Mortise, Drop Bolt ใช้สลักพินเหมาะประตูเปิดสองทาง/กระจก และ Mortise Lock ฝังในบาน ให้ความปลอดภัยสูงเหมาะโรงแรมหรือห้องสำคัญ',[['Magnetic/Fail-safe',['magnetic','แม่เหล็ก','fail-safe','ไฟดับ','ปลด']],['Electric Strike',['electric strike','ลูกบิด','strike']],['Drop Bolt',['drop bolt','สลัก','เปิดสองทาง','กระจก']],['Mortise',['mortise','ฝัง','ความปลอดภัยสูง','โรงแรม']]]),
        q('security','เปรียบเทียบหน้าที่ของ CCTV กับ Access Control','ระบบหนึ่ง “เห็นและบันทึก” อีกระบบ “ตรวจสิทธิ์และควบคุม”','CCTV ใช้เฝ้าดู บันทึกภาพ และตรวจสอบเหตุการณ์ย้อนหลัง ส่วน Access Control ใช้ระบุตัวตน ตรวจสิทธิ์ ควบคุมการเปิดประตู และบันทึกว่าใครเข้าออกเมื่อใด ทั้งสองระบบทำงานเสริมกัน',[['CCTV เฝ้าดู/บันทึก',['cctv','เฝ้าดู','บันทึก','ย้อนหลัง']],['Access ระบุตัวตน/สิทธิ์',['access','ระบุตัวตน','ตรวจสิทธิ์']],['ควบคุมประตู',['ประตู','ล็อก','เปิด']],['ทำงานเสริมกัน',['เสริมกัน','ร่วมกัน','เชื่อม']]]),

        q('fireProtection','สามเหลี่ยมไฟประกอบด้วยอะไร และใช้หลักนี้หยุดการเผาไหม้ได้อย่างไร','มี 3 องค์ประกอบ ถ้าขาดหนึ่งอย่างจะเกิดอะไร','สามเหลี่ยมไฟประกอบด้วยเชื้อเพลิง ออกซิเจน และความร้อน การดับไฟทำได้โดยกำจัดเชื้อเพลิง ลดความร้อน หรือกั้น/ลดออกซิเจน เมื่อขาดองค์ประกอบหนึ่งการเผาไหม้จะหยุด',[['เชื้อเพลิง',['เชื้อเพลิง','fuel']],['ออกซิเจน',['ออกซิเจน','oxygen']],['ความร้อน',['ความร้อน','heat']],['ตัดองค์ประกอบหนึ่ง',['กำจัด','ลด','กั้น','หยุด','ขาด']]]),
        q('fireProtection','ระบบป้องกันอัคคีภัยแบบ Passive และ Active ต่างกันอย่างไร พร้อมยกตัวอย่าง','Passive ไม่ต้องรอคำสั่งทำงาน ส่วน Active ตรวจ/แจ้ง/ดับ','Passive Fire Protection เป็นส่วนก่อสร้างที่จำกัดการลามของไฟและควัน เช่น ผนัง/พื้นทนไฟ Compartment, Fire Door และ Firestop ส่วน Active ใช้อุปกรณ์ตรวจจับ แจ้งเตือน และระงับเหตุ เช่น Fire Alarm, Sprinkler และระบบก๊าซ',[['Passive จำกัดการลาม',['passive','จำกัด','กั้น','ลาม']],['ตัวอย่าง Passive',['compartment','fire door','firestop','ผนังทนไฟ']],['Active ตรวจ/แจ้ง/ดับ',['active','ตรวจจับ','แจ้งเตือน','ระงับ']],['ตัวอย่าง Active',['fire alarm','sprinkler','สปริงเกลอร์','ก๊าซ']]]),
        q('fireProtection','Compartmentation มีหน้าที่อย่างไรต่อความปลอดภัยของอาคาร','พูดถึงการกักไฟ เวลาอพยพ และการแบ่งแนวราบ/แนวดิ่ง','Compartmentation แบ่งอาคารเป็นส่วนด้วยผนัง พื้น ประตู และช่องเปิดทนไฟเพื่อกักไฟและควัน ลดการลุกลามและความเสียหาย พร้อมเพิ่มเวลาให้อพยพและให้นักดับเพลิงเข้าควบคุมเหตุ ทั้งแนวราบและแนวดิ่งต้องรักษาความต่อเนื่องของแนวกั้นไฟ',[['แบ่งพื้นที่ด้วยส่วนทนไฟ',['แบ่ง','ผนัง','พื้น','ประตู','ทนไฟ']],['กักไฟ/ควันและลดลาม',['กัก','ควัน','ลุกลาม','จำกัด']],['เพิ่มเวลาอพยพ',['เวลา','อพยพ']],['ช่วยดับเพลิง/ลดเสียหาย',['นักดับเพลิง','ควบคุม','ความเสียหาย']]]),
        q('fireProtection','ทางหนีไฟแนวราบและแนวดิ่งต่างกันอย่างไร และ Fire Door ที่ดีควรเป็นอย่างไร','แนวราบไม่เปลี่ยนชั้น แนวดิ่งใช้สิ่งใด','แนวราบคือการเคลื่อนไปยังพื้นที่ปลอดภัยข้างเคียงในระดับเดิมผ่านแนวกั้นทนไฟ ส่วนแนวดิ่งใช้บันไดหนีไฟหรือระบบลิฟต์สำหรับนักดับเพลิง Fire Door ต้องมีอัตราทนไฟ ปิดได้เอง ไม่ถูกค้ำเปิด และเปิดไปทางบันไดหนีไฟ/ทิศทางอพยพ',[['แนวราบระดับเดิม',['แนวราบ','ระดับเดิม','ไม่เปลี่ยนชั้น','พื้นที่ข้างเคียง']],['แนวดิ่ง/บันไดหนีไฟ',['แนวดิ่ง','บันไดหนีไฟ','ลิฟต์ดับเพลิง']],['Fire Door ทนไฟ/ปิดเอง',['fire door','ประตูทนไฟ','ปิดเอง']],['ทิศเปิด/ไม่ค้ำ',['เปิดไปทาง','ทิศอพยพ','ไม่ค้ำ','ห้ามค้ำ']]]),
        q('fireProtection','Firestop สำคัญอย่างไรในงานระบบอาคาร','นึกถึงรูที่สายไฟ ท่อ และดักท์ทะลุผนัง/พื้นทนไฟ','Firestop คือวัสดุหรือระบบอุดปิดช่องทะลุของสายไฟ ท่อ และดักท์ที่ผ่านผนังหรือพื้นทนไฟ เพื่อคืนความต่อเนื่องและอัตราทนไฟของแนวกั้น ป้องกันไฟ ควัน และก๊าซร้อนลามผ่านช่องเปิด',[['อุดช่องทะลุ',['อุด','ปิด','ช่องทะลุ']],['สาย/ท่อ/ดักท์',['สายไฟ','ท่อ','ดักท์','duct']],['รักษาอัตราทนไฟ',['ทนไฟ','ความต่อเนื่อง','แนวกั้น']],['กันไฟและควันลาม',['ไฟ','ควัน','ลาม','ก๊าซร้อน']]]),
        q('fireProtection','Fire Command Center ควรอยู่ที่ใด มีคุณสมบัติห้องและอุปกรณ์สำคัญอะไรบ้าง','ตอบตำแหน่ง อัตราทนไฟ และยกอุปกรณ์อย่างน้อย 3 ชนิด','ควรอยู่ชั้นล่างหรือชั้น 1 ที่นักดับเพลิงเข้าถึงง่าย ใกล้ลิฟต์ดับเพลิง ห้องมีอัตราทนไฟอย่างน้อย 2 ชั่วโมง ภายในมี Fire Alarm Control Panel, โทรศัพท์นักดับเพลิง, ควบคุมระบายควัน อัดอากาศบันได และลิฟต์ฉุกเฉิน',[['ชั้นล่าง/เข้าถึงง่าย',['ชั้นล่าง','ชั้น 1','เข้าถึงง่าย']],['ใกล้ลิฟต์ดับเพลิง',['ลิฟต์ดับเพลิง','firefighter lift']],['ทนไฟ 2 ชั่วโมง',['2 ชั่วโมง','2 ชม','ทนไฟ']],['อุปกรณ์ควบคุมหลัก',['fire alarm','โทรศัพท์','ระบายควัน','อัดอากาศ','ลิฟต์ฉุกเฉิน']]]),

        q('fireAlarm','ระบบแจ้งเหตุเพลิงไหม้ประกอบด้วย 3 ส่วนหลักอะไร และแต่ละส่วนทำหน้าที่อย่างไร','Detector, Notification และสมองกลาง','ประกอบด้วย 1) Detector ตรวจจับความร้อนหรือควัน 2) Notification แจ้งเตือนด้วย Bell, Siren, Strobe หรือ Voice ทั้งแบบ Manual/Automatic และ 3) Control Panel รับประมวลสัญญาณ แสดงตำแหน่งเหตุและสั่งการอุปกรณ์',[['Detector ตรวจจับ',['detector','ตรวจจับ','ความร้อน','ควัน']],['Notification แจ้งเตือน',['notification','bell','siren','strobe','voice','แจ้งเตือน']],['Control Panel ประมวลผล',['control panel','ประมวล','ตู้ควบคุม']],['แสดงตำแหน่ง/สั่งการ',['ตำแหน่ง','สั่ง','ควบคุม']]]),
        q('fireAlarm','Heat Detector และ Smoke Detector ต่างกันอย่างไร และควรเลือกตามอะไร','ตัวหนึ่งตอบสนองอุณหภูมิ อีกตัวตอบสนองอนุภาคจากการเผาไหม้','Heat Detector ตรวจอุณหภูมิถึงค่าที่กำหนดหรือเพิ่มขึ้นรวดเร็ว ส่วน Smoke Detector ตรวจอนุภาคควันจึงมักแจ้งได้ตั้งแต่ระยะเริ่มต้น การเลือกต้องดูสภาพพื้นที่ ไอน้ำ ฝุ่น ความสูงฝ้า และลักษณะความเสี่ยงเพื่อหลีกเลี่ยงสัญญาณลวง',[['Heat/อุณหภูมิ',['heat detector','อุณหภูมิ','ความร้อน']],['ค่าคงที่/เพิ่มเร็ว',['ค่าที่กำหนด','เพิ่มขึ้นรวดเร็ว','rate']],['Smoke/อนุภาคควัน',['smoke detector','อนุภาค','ควัน']],['เลือกตามสภาพพื้นที่',['ไอน้ำ','ฝุ่น','พื้นที่','ความสูง','ความเสี่ยง','สัญญาณลวง']]]),
        q('fireAlarm','อธิบายหลักการระงับอัคคีภัยโดยเชื่อมโยงกับสามเหลี่ยมไฟ','ระบบน้ำ ก๊าซ และสารเคมีตัดองค์ประกอบต่างกัน','การระงับไฟทำได้โดยลดความร้อน เช่น น้ำ/สปริงเกลอร์, ลดหรือแทนที่ออกซิเจน เช่น ก๊าซบางชนิด, แยกเชื้อเพลิง หรือยับยั้งปฏิกิริยาลูกโซ่ด้วยสารเคมี จึงต้องเลือกสารให้เหมาะกับเชื้อเพลิงและพื้นที่',[['ลดความร้อน/น้ำ',['ลดความร้อน','น้ำ','sprinkler','สปริงเกลอร์']],['ลดออกซิเจน/ก๊าซ',['ออกซิเจน','ก๊าซ']],['แยกเชื้อเพลิง',['เชื้อเพลิง','แยก','กำจัด']],['ยับยั้งปฏิกิริยา/เลือกให้เหมาะ',['ปฏิกิริยา','สารเคมี','เลือก','เหมาะ']]]),
        q('fireAlarm','Sprinkler แบบ Pendant, Upright และ Sidewall ใช้ต่างกันอย่างไร','ดูทิศติดตั้งและข้อจำกัดพื้นที่','Pendant ห้อยลงจากท่อใต้ฝ้าและใช้ทั่วไป, Upright ตั้งขึ้นเหนือท่อเหมาะพื้นที่เปิด ที่จอดรถหรือคลังที่ต้องป้องกันการกระแทก, Sidewall ติดที่ผนังและกระจายน้ำออกด้านข้างเมื่อไม่สะดวกเดินท่อกลางฝ้า',[['Pendant ใต้ฝ้า/ทั่วไป',['pendant','ห้อย','ใต้ฝ้า','ทั่วไป']],['Upright ตั้งขึ้น',['upright','ตั้งขึ้น']],['ที่จอด/คลัง/ป้องกันกระแทก',['ที่จอด','คลัง','กระแทก']],['Sidewall ผนัง/ด้านข้าง',['sidewall','ผนัง','ด้านข้าง']]]),
        q('fireAlarm','เมื่อใดควรใช้ระบบดับเพลิงด้วย Clean Agent และมีข้อดีอะไร','คิดถึงห้อง Server และผลของน้ำหรือผงต่ออุปกรณ์','เหมาะกับห้อง Server, Data Center, ห้องควบคุม หรือพื้นที่อุปกรณ์/ทรัพย์สินมูลค่าสูงที่น้ำหรือผงทำความเสียหาย สารเช่น FM‑200, INERGEN หรือ Novec 1230 ไม่ทิ้งคราบและไม่ทำลายอุปกรณ์อิเล็กทรอนิกส์ แต่ต้องออกแบบความเข้มข้นและความปลอดภัยของคนโดยผู้เชี่ยวชาญ',[['พื้นที่อิเล็กทรอนิกส์/มูลค่าสูง',['server','data center','อิเล็กทรอนิกส์','มูลค่าสูง','ห้องควบคุม']],['น้ำ/ผงทำความเสียหาย',['น้ำ','ผง','เสียหาย']],['ตัวอย่างสาร',['fm-200','fm200','inergen','novec']],['ไม่ทิ้งคราบ/ออกแบบปลอดภัย',['ไม่ทิ้งคราบ','clean','ความเข้มข้น','ผู้เชี่ยวชาญ','ความปลอดภัย']]]),
        q('fireAlarm','Wet Pipe และ Dry Pipe ต่างกันอย่างไร','ในท่อมีน้ำตลอดหรือรอให้ระบบทำงาน','Wet Pipe มีน้ำอัดอยู่ในท่อตลอด เมื่อหัว Sprinkler เปิดน้ำออกได้ทันที เหมาะพื้นที่ทั่วไป ส่วน Dry Pipe ภายในเป็นอากาศ/ก๊าซและน้ำจะเข้าท่อเมื่อวาล์วทำงาน เหมาะบริเวณที่อุณหภูมิต่ำจนมีโอกาสน้ำแข็งตัว',[['Wet มีน้ำตลอด',['wet','น้ำ','ตลอด']],['เปิดแล้วจ่ายทันที',['ทันที','sprinkler','หัว']],['Dry มีอากาศ/รอวาล์ว',['dry','อากาศ','วาล์ว','น้ำเข้าท่อ']],['เหมาะอากาศเย็นจัด',['เย็น','น้ำแข็ง','ต่ำกว่าจุดเยือกแข็ง']]]),
        q('fireAlarm','จงจำแนกประเภทเพลิง A, B, C, D และ K พร้อมยกตัวอย่าง','เรียงจากของแข็ง ของเหลว ไฟฟ้า โลหะ และครัว','Class A คือของแข็งทั่วไป เช่น ไม้ กระดาษ, B คือของเหลวไวไฟ/น้ำมันเชื้อเพลิง, C คืออุปกรณ์ไฟฟ้าที่ยังมีกระแส, D คือโลหะไวปฏิกิริยา เช่น Magnesium/Titanium และ K คือน้ำมันหรือไขมันทำอาหาร',[['A ของแข็ง',['class a','คลาส a','ไม้','กระดาษ','ของแข็ง']],['B ของเหลวไวไฟ',['class b','คลาส b','ของเหลว','น้ำมันเชื้อเพลิง']],['C ไฟฟ้ามีกระแส',['class c','คลาส c','ไฟฟ้า','กระแส']],['D โลหะ',['class d','คลาส d','โลหะ','magnesium','แมกนีเซียม']],['K น้ำมันทำอาหาร',['class k','คลาส k','น้ำมันทำอาหาร','ไขมัน']]]),
        q('fireAlarm','เปรียบเทียบถังดับเพลิงชนิดน้ำ Foam, CO₂ และ Dry Chemical','ตอบชนิดเพลิงที่เหมาะและผลต่ออุปกรณ์','น้ำเหมาะ Class A และไม่ควรใช้กับไฟฟ้าหรือของเหลวไวไฟ, Foam เหมาะ A/B และคลุมผิวของเหลว, CO₂ เหมาะ B/C ไม่ทิ้งคราบจึงดีต่ออุปกรณ์ไฟฟ้า, Dry Chemical ใช้ B/C ได้กว้างแต่ทิ้งผงและอาจทำให้อุปกรณ์เสียหาย',[['น้ำ Class A/ห้ามไฟฟ้า',['น้ำ','class a','คลาส a','ไฟฟ้า']],['Foam A/B',['foam','โฟม','a/b','คลุม']],['CO2 B/C ไม่ทิ้งคราบ',['co2','co₂','b/c','ไม่ทิ้งคราบ']],['Dry Chemical ทิ้งผง',['dry chemical','ผงเคมี','ทิ้งผง','อุปกรณ์']]]),
        q('fireAlarm','ปัจจัยใดใช้เลือกระบบระงับอัคคีภัยให้เหมาะกับอาคาร','อย่าตอบแค่ราคา ให้เริ่มจากพื้นที่ เชื้อเพลิง และคน','พิจารณาประเภท/การใช้งานของพื้นที่และผู้ใช้อาคาร ชนิดเชื้อเพลิงหรือ Class ของเพลิง ความปลอดภัยต่อชีวิตและทรัพย์สิน มาตรฐานที่เกี่ยวข้อง งบติดตั้งและบำรุงรักษา ความพร้อมของระบบน้ำ/พื้นที่ และการฝึกอบรมผู้ใช้ โดยให้ผู้เชี่ยวชาญออกแบบและตรวจสอบ',[['พื้นที่และผู้ใช้',['พื้นที่','อาคาร','ผู้ใช้','คน']],['เชื้อเพลิง/Class',['เชื้อเพลิง','class','ประเภทเพลิง']],['ชีวิต/ทรัพย์สิน',['ชีวิต','ทรัพย์สิน','ความปลอดภัย']],['มาตรฐาน/ผู้เชี่ยวชาญ',['มาตรฐาน','nfpa','วสท','ผู้เชี่ยวชาญ']],['งบ/บำรุง/ฝึกอบรม',['งบ','บำรุง','ฝึกอบรม','ดูแล']]])
    ];

    const summaryContent = document.getElementById('examSummaryContent');
    const filterContainer = document.getElementById('examSubjectFilters');
    const searchInput = document.getElementById('examSummarySearch');
    const recallBtn = document.getElementById('recallModeBtn');
    let summaryFilter = 'all';

    function subjectById(id) { return subjects.find(subject => subject.id === id); }
    function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
    function highlight(text, query) {
        if (!query) return text;
        return text.replace(new RegExp(`(${escapeRegExp(query)})`,'gi'),'<mark>$1</mark>');
    }
    function stripHtml(text) { const node=document.createElement('div'); node.innerHTML=text; return node.textContent || ''; }

    function renderSummaryFilters() {
        if (!filterContainer) return;
        const filters = [{id:'all',icon:'✨',short:'ทั้งหมด'},...subjects];
        filterContainer.innerHTML = filters.map(item => `<button type="button" data-summary-filter="${item.id}" class="${item.id===summaryFilter?'active':''}">${item.icon} ${item.short}</button>`).join('');
    }

    function renderSummaries() {
        if (!summaryContent) return;
        const query = (searchInput?.value || '').trim();
        const normalized = query.toLocaleLowerCase('th');
        const visible = subjects.filter(subject => {
            if (summaryFilter !== 'all' && subject.id !== summaryFilter) return false;
            if (!normalized) return true;
            const haystack = [subject.title,subject.memory,...subject.flow,...subject.topics.flatMap(topic => [topic.title,...topic.items.map(stripHtml)])].join(' ').toLocaleLowerCase('th');
            return haystack.includes(normalized);
        });
        summaryContent.innerHTML = visible.length ? visible.map(subject => `
            <section class="summary-subject" style="--subject-soft:${subject.color}">
                <header class="summary-subject-header">
                    <span class="summary-subject-icon">${subject.icon}</span>
                    <div><h3>${highlight(subject.title,query)}</h3><p>${subject.memory}</p></div>
                    <span class="summary-memory-chip">${subject.topics.length} เรื่องที่ควรจำ</span>
                </header>
                <div class="summary-flow" aria-label="ลำดับระบบ">${subject.flow.map((step,index)=>`${index?'<i>→</i>':''}<span>${highlight(step,query)}</span>`).join('')}</div>
                <div class="summary-topic-grid">${subject.topics.map(topic=>`
                    <article class="summary-topic" tabindex="0"><h4>${highlight(topic.title,query)}</h4><ul>${topic.items.map(item=>`<li class="recall-answer">${highlight(item,query)}</li>`).join('')}</ul></article>
                `).join('')}</div>
            </section>`).join('') : '<div class="summary-empty">ไม่พบคำนี้ในสรุป ลองค้นด้วยคำที่สั้นลง เช่น “กล้อง” “ไฟ” หรือ “MDF”</div>';
    }

    filterContainer?.addEventListener('click',event=>{
        const button=event.target.closest('[data-summary-filter]'); if(!button)return;
        summaryFilter=button.dataset.summaryFilter; renderSummaryFilters(); renderSummaries();
    });
    searchInput?.addEventListener('input',renderSummaries);
    recallBtn?.addEventListener('click',()=>{
        const page=document.getElementById('examSummaryTab'); const active=!page.classList.contains('recall-mode');
        page.classList.toggle('recall-mode',active); recallBtn.setAttribute('aria-pressed',String(active)); recallBtn.textContent=active?'👀 แตะคำตอบเพื่อดู':'🙈 โหมดท่องจำ';
    });

    window.openExamPage = function(tabId) {
        const button=document.getElementById('examNavBtn');
        if (typeof window.openTab === 'function') window.openTab(tabId,button);
    };

    const state = { questions:[], index:0, answers:[], results:[], hints:[], models:[] };
    const subjectSelect=document.getElementById('examSubjectSelect');
    const difficultySelect=document.getElementById('examDifficultySelect');
    const countSelect=document.getElementById('examQuestionCount');
    const setupPanel=document.getElementById('examSetupPanel');
    const sessionPanel=document.getElementById('examSessionPanel');
    const card=document.getElementById('writtenQuestionCard');

    function shuffle(items) {
        const copy=[...items];
        for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
        return copy;
    }
    function normalizeAnswer(value) { return value.toLocaleLowerCase('th').replace(/[‐‑–—]/g,'-').replace(/\s+/g,' ').trim(); }
    function evaluate(question,answer) {
        const normalized=normalizeAnswer(answer);
        const checks=question.rubric.map(([label,terms])=>({label,matched:terms.some(term=>normalized.includes(normalizeAnswer(term)))}));
        const matched=checks.filter(item=>item.matched).length;
        const score=Math.round((matched/checks.length)*100);
        return {score,checks,charCount:answer.replace(/\s/g,'').length};
    }
    function renderExamCard() {
        if(!state.questions.length || !card)return;
        const question=state.questions[state.index];
        const subject=subjectById(question.subject);
        const difficultyLabels={easy:'🌱 ง่าย',medium:'🌼 กลาง',hard:'🔥 ยาก'};
        const answer=state.answers[state.index] || '';
        const result=state.results[state.index];
        card.innerHTML=`
            <div class="question-meta"><span>${subject.icon} ${subject.short}</span><span class="difficulty-badge ${question.difficulty}">${difficultyLabels[question.difficulty]}</span><span>ข้อ ${state.index+1}</span><small>ตอบเป็นประโยคของตัวเองได้</small></div>
            <h3>${question.question}</h3><p class="question-prompt-note">พยายามตอบให้ครบเหตุผล ลำดับ หรือจุดเปรียบเทียบตามที่โจทย์ถาม</p>
            <label class="answer-label">คำตอบของฉัน<textarea id="writtenAnswerInput" placeholder="ลองอธิบายจากความเข้าใจของตัวเอง…">${answer.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</textarea></label>
            <div class="question-actions"><button class="check-answer-btn" type="button" data-question-action="check">✓ ตรวจคำตอบ</button><button type="button" data-question-action="hint">💡 ${state.hints[state.index]?'ซ่อนคำใบ้':'ขอคำใบ้'}</button><button type="button" data-question-action="model">👀 ${state.models[state.index]?'ซ่อนเฉลย':'เฉลยข้อนี้'}</button></div>
            ${state.hints[state.index]?`<div class="question-help"><strong>💡 คำใบ้</strong>${question.hint}</div>`:''}
            ${result?renderFeedback(result):''}
            ${state.models[state.index]?`<div class="model-answer"><strong>📖 เฉลยและแนวเรียบเรียง</strong>${question.answer}</div>`:''}`;
        card.querySelector('textarea')?.addEventListener('input',event=>{state.answers[state.index]=event.target.value;});
        updateExamStatus();
    }
    function renderFeedback(result) {
        const tone=result.score>=80?'good':result.score>=50?'medium':'needs-work';
        const headline=result.score>=80?'ครบประเด็นดีมาก':result.score>=50?'มาถูกทางแล้ว':'ยังขาดใจความสำคัญ';
        return `<div class="question-feedback ${tone}"><div class="feedback-score"><span>${headline}</span><strong>${result.score}%</strong></div><ul class="feedback-list">${result.checks.map(item=>`<li class="${item.matched?'matched':'missing'}">${item.matched?'✓ มี':'○ ควรเพิ่ม'}: ${item.label}</li>`).join('')}${result.charCount<35?'<li class="missing">○ คำตอบค่อนข้างสั้น ลองอธิบายเหตุผลหรือความสัมพันธ์เพิ่ม</li>':''}</ul></div>`;
    }
    function updateExamStatus() {
        const total=state.questions.length; const checked=state.results.filter(Boolean); const average=checked.length?Math.round(checked.reduce((sum,item)=>sum+item.score,0)/checked.length):0;
        const progress=document.getElementById('examProgressText'); const score=document.getElementById('examScoreText'); const bar=document.getElementById('examProgressBar');
        if(progress)progress.textContent=`ข้อ ${state.index+1} / ${total}`;
        if(score)score.textContent=checked.length?`ตรวจแล้ว ${checked.length} ข้อ · เฉลี่ย ${average}%`:'ยังไม่ได้ตรวจ';
        if(bar)bar.style.width=`${((state.index+1)/total)*100}%`;
        document.getElementById('prevExamQuestionBtn').disabled=state.index===0;
        document.getElementById('nextExamQuestionBtn').disabled=state.index===total-1;
        const dots=document.getElementById('examQuestionDots');
        if(dots)dots.innerHTML=state.questions.map((_,index)=>`<button type="button" data-question-index="${index}" class="${index===state.index?'active':''} ${state.results[index]?'checked':''}" aria-label="ไปข้อ ${index+1}">${index+1}</button>`).join('');
    }
    function startExam() {
        const pool=getFilteredQuestionPool(); const count=Math.min(Number(countSelect.value),pool.length);
        state.questions=shuffle(pool).slice(0,count); state.index=0; state.answers=Array(count).fill(''); state.results=Array(count).fill(null); state.hints=Array(count).fill(false); state.models=Array(count).fill(false);
        setupPanel.hidden=true; sessionPanel.hidden=false; renderExamCard();
    }
    function saveCurrentAnswer(){const input=document.getElementById('writtenAnswerInput');if(input)state.answers[state.index]=input.value;}
    function moveQuestion(index){saveCurrentAnswer();state.index=Math.max(0,Math.min(index,state.questions.length-1));renderExamCard();card.scrollIntoView({behavior:'smooth',block:'start'});}

    card?.addEventListener('click',event=>{
        const button=event.target.closest('[data-question-action]');if(!button)return;
        saveCurrentAnswer(); const action=button.dataset.questionAction;
        if(action==='check'){
            if(!state.answers[state.index].trim()){const input=document.getElementById('writtenAnswerInput');input.focus();input.placeholder='พิมพ์คำตอบก่อน แล้วค่อยกดตรวจนะ';return;}
            state.results[state.index]=evaluate(state.questions[state.index],state.answers[state.index]);
        } else if(action==='hint') state.hints[state.index]=!state.hints[state.index];
        else if(action==='model') state.models[state.index]=!state.models[state.index];
        renderExamCard();
    });
    document.getElementById('startWrittenExamBtn')?.addEventListener('click',startExam);
    document.getElementById('newExamBtn')?.addEventListener('click',()=>{saveCurrentAnswer();sessionPanel.hidden=true;setupPanel.hidden=false;});
    document.getElementById('prevExamQuestionBtn')?.addEventListener('click',()=>moveQuestion(state.index-1));
    document.getElementById('nextExamQuestionBtn')?.addEventListener('click',()=>moveQuestion(state.index+1));
    document.getElementById('examQuestionDots')?.addEventListener('click',event=>{const button=event.target.closest('[data-question-index]');if(button)moveQuestion(Number(button.dataset.questionIndex));});

    if(subjectSelect)subjectSelect.innerHTML=`<option value="all">สุ่มรวมทุกบท</option>${subjects.map(subject=>`<option value="${subject.id}">${subject.icon} ${subject.title}</option>`).join('')}`;
    function getFilteredQuestionPool(){
        const subject=subjectSelect?.value || 'all'; const difficulty=difficultySelect?.value || 'all';
        return questionBank.filter(item=>(subject==='all'||item.subject===subject)&&(difficulty==='all'||item.difficulty===difficulty));
    }
    function refreshQuestionCounts(){
        if(!subjectSelect || !countSelect)return;
        const available=getFilteredQuestionPool().length;
        const choices=[5,10,15,20].filter(value=>value<available); choices.push(available);
        countSelect.innerHTML=[...new Set(choices)].map(value=>`<option value="${value}" ${value===Math.min(10,available)?'selected':''}>${value} ข้อ${value===available&&available<10?' · ครบทั้งบท':''}</option>`).join('');
    }
    subjectSelect?.addEventListener('change',refreshQuestionCounts);
    difficultySelect?.addEventListener('change',refreshQuestionCounts);
    refreshQuestionCounts();
    const bankCount=document.getElementById('questionBankCount');if(bankCount)bankCount.textContent=String(questionBank.length);
    renderSummaryFilters(); renderSummaries();
})();
