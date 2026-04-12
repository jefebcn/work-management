import React from 'react'
import { useApp } from '../../context/AppContext.jsx'
import FormulaList from './FormulaList.jsx'
import FormulaBuilder from './FormulaBuilder.jsx'

export default function FormulatorPage() {
  const { activeFormula } = useApp()

  // Show the builder if a formula is active, otherwise show the list
  return activeFormula ? <FormulaBuilder /> : <FormulaList />
}
