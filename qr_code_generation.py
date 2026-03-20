import tkinter as tk
from tkinter import messagebox, filedialog
from PIL import Image, ImageTk
import qrcode
import os

class QRCodeApp:
    def __init__(self, root):
        self.root = root
        self.root.title("QR Code Generator for Link")
        self.root.geometry("500x650")
        self.root.resizable(False, False)

        self.qr_image = None
        self.preview_image = None

        title = tk.Label(
            root,
            text="QR Code Generator",
            font=("Arial", 18, "bold")
        )
        title.pack(pady=15)

        instruction = tk.Label(
            root,
            text="Enter a link below to generate a QR code:",
            font=("Arial", 11)
        )
        instruction.pack(pady=5)

        self.link_entry = tk.Entry(root, width=50, font=("Arial", 11))
        self.link_entry.pack(pady=10, ipady=5)

        button_frame = tk.Frame(root)
        button_frame.pack(pady=10)

        generate_btn = tk.Button(
            button_frame,
            text="Generate QR",
            font=("Arial", 11, "bold"),
            command=self.generate_qr,
            width=15
        )
        generate_btn.grid(row=0, column=0, padx=10)

        save_btn = tk.Button(
            button_frame,
            text="Save as PNG",
            font=("Arial", 11, "bold"),
            command=self.save_qr,
            width=15
        )
        save_btn.grid(row=0, column=1, padx=10)

        self.preview_label = tk.Label(root, text="QR Preview will appear here", font=("Arial", 10))
        self.preview_label.pack(pady=20)

    def generate_qr(self):
        link = self.link_entry.get().strip()

        if not link:
            messagebox.showerror("Error", "Please enter a link.")
            return

        try:
            qr = qrcode.QRCode(
                version=1,
                box_size=10,
                border=4
            )
            qr.add_data(link)
            qr.make(fit=True)

            self.qr_image = qr.make_image(fill_color="black", back_color="white").convert("RGB")

            preview = self.qr_image.resize((300, 300))
            self.preview_image = ImageTk.PhotoImage(preview)

            self.preview_label.config(image=self.preview_image, text="")
            messagebox.showinfo("Success", "QR code generated successfully.")

        except Exception as e:
            messagebox.showerror("Error", f"Failed to generate QR code.\n{e}")

    def save_qr(self):
        if self.qr_image is None:
            messagebox.showwarning("Warning", "Please generate a QR code first.")
            return

        file_path = filedialog.asksaveasfilename(
            defaultextension=".png",
            filetypes=[("PNG files", "*.png")],
            title="Save QR Code As"
        )

        if file_path:
            try:
                self.qr_image.save(file_path)
                messagebox.showinfo("Saved", f"QR code saved successfully.\n{file_path}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save image.\n{e}")


if __name__ == "__main__":
    root = tk.Tk()
    app = QRCodeApp(root)
    root.mainloop()
