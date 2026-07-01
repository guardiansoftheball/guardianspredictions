import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";

const imgLogo      = "/guardiansPredictionLogo.svg";
const imgIconClose = "/icons/icon-close.svg";

const ForgotPasswordModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [email, setEmail] = useState("");

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#618FC7]/10 backdrop-blur-md">
      {/* Card */}
      <div className="relative flex flex-col gap-5 w-[516px] max-w-[95vw] rounded-[41px] border border-white/30 bg-white/20 px-14 py-12 shadow-2xl backdrop-blur-xl">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-6 top-5 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Cerrar"
        >
          <img src={imgIconClose} alt="cerrar" className="h-[18px] w-[18px]" />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img src={imgLogo} alt="Guardians Predictions" className="h-16 w-auto" />
        </div>

        {/* Copy */}
        <p className="text-center text-white/90 text-[16px]">
          Ingresá tu e-mail y te enviaremos instrucciones para recuperar tu contraseña.
        </p>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          <Input
            type="text"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        {/* Enviar */}
        <div className="flex justify-end">
          <Button variant="primary" withArrow>
            Enviar
          </Button>
        </div>

        {/* Volver a login */}
        <div className="flex justify-center">
          <button
            onClick={onSwitchToLogin}
            className="text-white/95 text-[16px] underline hover:text-white transition-colors"
          >
            Volver a iniciar sesión
          </button>
        </div>

      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default ForgotPasswordModal;
