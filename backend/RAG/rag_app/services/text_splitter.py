def split_text_into_chunks(text):
    chunk_size = 500
    overlap = 50 # overlap karna ka main reason haiye ki katne ke baad contex na tute ys liye (main 50 characters previous chunk ke next me bhi daalunga)

    chunks = []
    start =0

    while start < len(text):
        end = start + chunk_size

        chunk = text[start: end]

        chunks.append(chunk)

        start = end - overlap

    return chunks
