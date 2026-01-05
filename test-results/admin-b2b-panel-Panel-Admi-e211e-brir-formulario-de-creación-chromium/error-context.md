# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - img [ref=e7]
        - heading "Tus Aguacates" [level=1] [ref=e11]
        - paragraph [ref=e12]: Panel de Administración
      - generic [ref=e13]:
        - heading "Iniciar Sesión" [level=2] [ref=e14]
        - generic [ref=e15]:
          - generic [ref=e16]:
            - generic [ref=e17]: Correo electrónico
            - textbox "Correo electrónico" [ref=e18]:
              - /placeholder: admin@tusaguacates.com
          - generic [ref=e19]:
            - generic [ref=e20]: Contraseña
            - generic [ref=e21]:
              - textbox "Contraseña" [ref=e22]:
                - /placeholder: ••••••••
              - button [ref=e23] [cursor=pointer]:
                - img [ref=e24]
          - button "Iniciar Sesión" [ref=e27] [cursor=pointer]
        - paragraph [ref=e29]:
          - strong [ref=e30]: "Credenciales:"
          - text: admin@tusaguacates.com
          - text: admin123
      - link "← Volver a la tienda" [ref=e32] [cursor=pointer]:
        - /url: /
  - alert [ref=e33]
```