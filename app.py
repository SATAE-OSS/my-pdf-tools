import streamlit as st
from PIL import Image
import io

st.set_page_config(page_title="PDF & Image Tools", layout="wide")
st.title("🛠️ เครื่องมือจัดการเอกสาร (ใช้ได้ทุกอุปกรณ์)")

st.header("🖼️ รวมรูปภาพและจัดเรียงเป็น PDF")
# รับไฟล์
uploaded_files = st.file_uploader("อัปโหลดรูปภาพ (JPG, PNG)", type=['jpg', 'jpeg', 'png'], accept_multiple_files=True)

if uploaded_files:
    # 1. จัดการระบบความจำ (Session State) เพื่อจำลำดับภาพ
    if 'file_names' not in st.session_state or len(st.session_state.file_names) != len(uploaded_files):
        st.session_state.file_names = [f.name for f in uploaded_files]
    
    file_dict = {f.name: f for f in uploaded_files}

    st.write("### 👁️ จัดเรียงและพรีวิวรูปภาพ")
    st.caption("💡 กดปุ่ม ⬅️ หรือ ➡️ ใต้ภาพเพื่อสลับลำดับหน้า PDF")
    
    # แบ่งเป็น 3 คอลัมน์ (ถ้าดูในมือถือมันจะเรียงลงมาให้เองอัตโนมัติ)
    cols = st.columns(3)
    
    # ฟังก์ชันสลับตำแหน่งซ้าย-ขวา
    def move_left(index):
        if index > 0:
            st.session_state.file_names[index], st.session_state.file_names[index-1] = \
            st.session_state.file_names[index-1], st.session_state.file_names[index]

    def move_right(index):
        if index < len(st.session_state.file_names) - 1:
            st.session_state.file_names[index], st.session_state.file_names[index+1] = \
            st.session_state.file_names[index+1], st.session_state.file_names[index]

    images = []
    # 2. แสดงภาพตามลำดับที่จัดเรียง
    for i, fname in enumerate(st.session_state.file_names):
        file = file_dict[fname]
        img = Image.open(file).convert('RGB')
        images.append(img)
        
        with cols[i % 3]:
            st.image(img, caption=f"หน้าที่ {i+1}: {fname}", use_container_width=True)
            
            # ปุ่มสลับตำแหน่ง
            c1, c2 = st.columns(2)
            with c1:
                if st.button("⬅️ ก่อนหน้า", key=f"L_{i}", disabled=(i == 0), use_container_width=True):
                    move_left(i)
                    st.rerun()
            with c2:
                if st.button("ถัดไป ➡️", key=f"R_{i}", disabled=(i == len(st.session_state.file_names)-1), use_container_width=True):
                    move_right(i)
                    st.rerun()

    st.divider()
    
    # 3. ส่วนของการดาวน์โหลด
    pdf_name = st.text_input("ตั้งชื่อไฟล์ PDF ที่ต้องการ", value="merged_document.pdf")
    
    if st.button("✨ ยืนยันการสร้างไฟล์ PDF", type="primary"):
        if images:
            pdf_bytes = io.BytesIO()
            images[0].save(pdf_bytes, format='PDF', save_all=True, append_images=images[1:])
            st.success("🎉 สร้างเอกสารสำเร็จ! กดปุ่มด้านล่างเพื่อโหลดเก็บไว้ได้เลย")
            st.download_button(label="⬇️ ดาวน์โหลดไฟล์ PDF", data=pdf_bytes.getvalue(), file_name=pdf_name, mime="application/pdf")