import layoutparser as lp 
# print(dir(lp))

from vila.pdftools.pdf_extractor import PDFExtractor
from vila.predictors import HierarchicalPDFPredictor
from tqdm import tqdm
import matplotlib.pyplot as plt
import matplotlib.patches as patches

from collections import defaultdict

import os

data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/cv/'))


def vila_predict(pdf_path, pdf_extractor, vision_model, layout_model):
    page_tokens, page_images = pdf_extractor.load_tokens_and_image(pdf_path)

    pred_tokens = []
    for page_token, page_image in tqdm(zip(page_tokens, page_images), total=len(page_tokens), desc="Processing Pages", unit="page"):
        blocks = vision_model.detect(page_image)
        page_token.annotate(blocks=blocks)
        pdf_data = page_token.to_pagedata().to_dict()
        pred_tokens += layout_model.predict(pdf_data, page_token.page_size)

    return pred_tokens

def construct_token_groups(pred_tokens):
    groups, group, group_type, prev_bbox = [], [], None, None
    
    for token in pred_tokens:
        if group_type is None:
            is_continued = True
            
        elif token.type == group_type:
            if group_type == 'section':
                is_continued = abs(prev_bbox[3] - token.coordinates[3]) < 1.
            else:
                is_continued = True

        else:
            is_continued = False

        
        # print(token.text, token.type, is_continued)
        group_type = token.type
        prev_bbox = token.coordinates
        if is_continued:
            group.append(token)
        
        else:
            groups.append(group)
            group = [token]
    
    if group:
        groups.append(group)

    return groups

def join_group_text(group):
    text = ''
    prev_bbox = None
    for token in group:
        if not text:
            text += token.text
    
        else:        
            if abs(prev_bbox[2] - token.coordinates[0]) > 2:
                text += ' ' + token.text
    
            else:
                text += token.text
    
        prev_bbox = token.coordinates
    return text

def construct_section_groups(token_groups):
    section_groups = defaultdict(list)

    section = None
    for group in token_groups:
        group_type = group[0].type
        group_text = join_group_text(group)
        
        if group_type == 'section':
            section = group_text
            section_groups[section]
    
        elif group_type == 'paragraph' and section is not None:
            section_groups[section].append(group_text)

    section_groups = {k: ' '.join(v) for k,v in section_groups.items()}
    return section_groups

class MergedTextBlock:
    def __init__(self, text, type, coordinates):
        self.text = text
        self.type = type
        self.coordinates = coordinates

def merge_tokens_to_sentences(pred_tokens):
    sentences = []
    sentence = []
    prev_bbox = None
    
    for token in pred_tokens:
        token_text = token.text
        token_type = token.type
        token_coordinates = token.coordinates

        if not sentence:
            sentence.append(token)
        else:
            if prev_bbox and abs(prev_bbox[2] - token_coordinates[0]) > 10:
                sentences.append(sentence)
                sentence = [token]
            else:
                sentence.append(token)

        prev_bbox = token_coordinates
    
    if sentence:
        sentences.append(sentence)

    return [MergedTextBlock(
                text=" ".join([t.text for t in sentence]), 
                type=sentence[0].type, 
                coordinates=sentence[0].coordinates) 
            for sentence in sentences]

def visualize_predictions(pdf_path, pdf_extractor, vision_model, layout_model):
    page_tokens, page_images = pdf_extractor.load_tokens_and_image(pdf_path)
    pred_tokens = vila_predict(pdf_path, pdf_extractor, vision_model, layout_model)

    for idx, (page_image, page_token) in enumerate(zip(page_images, page_tokens)):
        fig, ax = plt.subplots(1, figsize=(10, 14))
        ax.imshow(page_image) 
        
  
        for token in pred_tokens:
            if token.block:
                rect = patches.Rectangle(
                    (token.block.x_1, token.block.y_1),  
                    token.block.x_2 - token.block.x_1, 
                    token.block.y_2 - token.block.y_1, 
                    linewidth=1.5, edgecolor='red', facecolor='none'
                )
                ax.add_patch(rect)
        
        plt.title(f'Page {idx + 1}')
        plt.axis('off')
        plt.show()

def save_text(pred_tokens, txt_path):
    with open(txt_path, 'w', encoding='utf-8') as f:
        for token in pred_tokens:
            if token.text:
                f.write(token.text + '\n')
    print(f'Text saved to {txt_path}')


pdf_path = os.path.join(data_path, 'cv_kr_example.pdf')
txt_path = os.path.join(data_path, 'cv_kr_example_vila.txt')

def load_vila_models():
    pdf_extractor = PDFExtractor(pdf_extractor_name="pdfplumber")
    vision_model = lp.EfficientDetLayoutModel("lp://PubLayNet")
    pdf_predictor = HierarchicalPDFPredictor.from_pretrained("allenai/hvila-block-layoutlm-finetuned-docbank")

    return pdf_extractor, vision_model, pdf_predictor


# print("====== ViLA Prediction ======")

def extract_cv_info(pdf_path):
    pdf_extractor, vision_model, pdf_predictor = load_vila_models()

    pred_tokens = vila_predict(pdf_path, pdf_extractor, vision_model, pdf_predictor)

    merge_tokens = merge_tokens_to_sentences(pred_tokens)

    return merge_tokens

def run_vila(pdf_path, txt_path):
    merge_tokens = extract_cv_info(pdf_path)

    save_text(merge_tokens, txt_path)

# visualize_predictions(pdf_path, pdf_extractor, vision_model, pdf_predictor)

