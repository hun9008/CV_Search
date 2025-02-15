import layoutparser as lp 
# print(dir(lp))

from vila.pdftools.pdf_extractor import PDFExtractor
from vila.predictors import HierarchicalPDFPredictor
from tqdm import tqdm
import matplotlib.pyplot as plt
import matplotlib.patches as patches

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


pdf_path = os.path.join(data_path, 'cv_example.pdf')

pdf_extractor = PDFExtractor(pdf_extractor_name="pdfplumber")
vision_model = lp.EfficientDetLayoutModel("lp://PubLayNet")
pdf_predictor = HierarchicalPDFPredictor.from_pretrained("allenai/hvila-block-layoutlm-finetuned-docbank")


print("====== ViLA Prediction ======")

pred_tokens = vila_predict(pdf_path, pdf_extractor, vision_model, pdf_predictor)
# for token in pred_tokens:
#     print(token)

visualize_predictions(pdf_path, pdf_extractor, vision_model, pdf_predictor)

txt_path = os.path.join(data_path, 'cv_example_vila.txt')
save_text(pred_tokens, txt_path)
