<?xml version="1.0"?>
<!-- Preview active projects. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="project">
    <h1 class="project"><xsl:value-of select="name"/></h1>
  </xsl:template>
</xsl:stylesheet>
