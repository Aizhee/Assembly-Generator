# A simple script to generate assembly code to print ASCII characters from a text file
# The generated assembly code is compatible with emu8086
# ================================================================

# Read input from a text file and generate assembly code

def generate_assembly(input_file, output_file):
    with open(input_file, 'r') as file:
        data = file.read().strip()
    
    with open(output_file, 'w') as file:
        file.write("; You may customize this and other start-up templates\n")
        file.write("; The location of this template is c:\\emu8086\\inc\\0_com_template.txt\n\n")
        file.write(".model small\n")
        file.write(".stack\n")
        file.write(".code\n\n")
        file.write("start:\n\n")
        
        for char in data:
            file.write("    mov ah,02h\n")
            if char == '\n':
                file.write("    mov dl,0dh ;CR\n")
                file.write("    int 21h\n")
                file.write("    mov dl,0ah ;LF\n")
                file.write("    int 21h\n")
            elif char == '\t':
                file.write("    mov dl,09h ;tab\n")
                file.write("    int 21h\n")
            elif char == ' ':
                file.write("    mov dl,20h ;space\n")
                file.write("    int 21h\n")
            else:
                file.write(f"    mov dl,{hex(ord(char))}h ;{char}\n")
                file.write("    int 21h\n")
        
        file.write("\n    mov ah,4Ch\n")
        file.write("    int 21h\n")

def fix_output(output_file):
    with open(output_file, 'r') as file:
        data = file.read()
    
    data = data.replace('0x', '')
    
    with open(output_file, 'w') as file:
        file.write(data)
        
        
# Example usage
generate_assembly('input.txt', 'output.asm')
fix_output('output.asm')